# Toolkit Telemetry System Design

The AWS Toolkits offer a variety of developer focused features for working with AWS within the IDE. Complementing feature requests, issues, and user anecdotes, telemetry within the toolkit helps the development team understand which features are used, and helps inform where future utility can be added. The Toolkit for each family of IDEs is a separate implementation. This document describes the intended client-side telemetry design for all AWS Toolkits. This aims to remove the guesswork around how each toolkit handles telemetry by reducing divergences.

## Tenets

Unless we know otherwise, these are the key motivations behind the design. They are in priority order.

-   This represents an ideal design
    -   It is not written based on any Toolkit
    -   The current Toolkit telemetry systems may not reflect this design - product maintainers are responsible for identifying differences, which can be prioritized
    -   When a product has a deliberate divergence from this design, it MUST be documented and approved
-   Have a negligible impact on performance and stability
    -   From the customer’s perspective, Telemetry is the least important toolkit component
    -   The toolkit MUST NOT freeze up, block, or otherwise negatively impact users at any point due to the telemetry system
    -   The telemetry system MUST NOT consume too much of a client’s resources (including but not limited to network, disk, CPU, memory)
    -   An exception within the telemetry system:
        -   MUST NOT crash the toolkit/IDE
        -   MUST NOT stop the main telemetry loop
        -   MUST NOT be messaged or displayed to the user
        -   MUST be logged
-   Transmitting Telemetry to the backend is done on a BEST EFFORT basis
    -   To satisfy the earlier tenet, this design avoids writing frequent snapshots of unsent metrics to disk.
    -   It is acceptable to lose metrics when the host IDE encounters an uncontrolled shutdown (for example: hard crash).
    -   It is acceptable to lose metrics at the end of a controlled shutdown (opting for a simpler design and avoiding a client-side disk cache)

## Goals

These are some important requirements to be mindful of in the design.

-   MUST NOT hinder toolkit activation (bad experience)
    -   Blocking processes (such as getting credentials from Cognito) MUST occur on background threads.
    -   Toolkit code (including activation code) SHOULD be able to start queuing metrics as soon as possible, even if the telemetry system isn’t able to send them yet.
-   Recording a metric MUST NOT impact toolkit responsiveness (bad experience)
    -   Get metrics on a queue fast
    -   Process queue in background thread
-   MUST NOT hinder toolkit shutdown (bad experience)
    -   Some IDEs (VS Code) are given a limited amount of time before being force terminated
    -   You cannot guarantee an over-the-wire call will succeed quickly, or complete before IDE shutdown
-   Find a reasonable balance in how frequently metrics are sent to the backend
    -   SHOULD NOT flood the telemetry service with requests
    -   SHOULD NOT hoard telemetry client-side either
-   Telemetry system MUST honor user preferences for enabling/disabling telemetry as soon as possible (ideally immediately)

## Terminology

-   **Telemetry Queue** - All Toolkit metrics are recorded here, where they remain until they are sent to the backend, or until the Toolkit closes
-   **Backend** - the IDEs telemetry service, which receives all transmitted metrics
-   **Telemetry Client** - An SDK interface around the Backend API. Each toolkit has its own Client that performs language-appropriate marshaling.
-   **Telemetry Publisher** - Responsible for taking metrics off the Queue and sending them to the backend using the Client

## Toolkit Initialization

When the toolkit is initialized, a Telemetry Queue is made available to the toolkit as soon as possible. Toolkit code can now start queuing metrics, even though the telemetry system is not yet configured to send metrics to the backend.

On a background thread, the following happens

-   telemetry credentials are obtained
-   a Telemetry Client is created
-   a Telemetry Publisher is initialized, with access to the Telemetry Queue and the Telemetry Client
-   the Telemetry Publisher is instructed to start transmitting telemetry data from the Queue on a regular cadence (see next section)

Until the Telemetry Publisher is created and starts to transmit telemetry, metrics are simply queued by the Telemetry system. The Toolkit is not concerned about when the Publisher is operational, since the Publisher will start to send metrics after it is initialized.

## Telemetry Publisher

Once started, the Publisher routinely checks to see if telemetry should be sent to the backend, and sends it if necessary. This is accomplished with an “outer loop” and an “inner loop”. The outer loop determines if telemetry should be sent to the backend (see criteria below). When telemetry should be sent, the inner loop is started up, which transmits metrics to the backend. Both loops are performed on a background thread.

The base outer loop period is 20 seconds.

-   The period SHOULD NOT be too fast to cause excessive load on the backend
-   The period SHOULD NOT be too slow to increase the risk of losing good metrics during an uncontrolled/unstable termination
-   There are circumstances (like backoff strategies) where the period is temporarily increased.

The following criteria assesses whether to send telemetry or not:

-   DO NOT send telemetry if the user has disabled telemetry
-   DO NOT send telemetry if the Telemetry system is in the process of shutting down (see Toolkit Shutdown)
-   DO send telemetry if the queue contains more than a threshold amount of metrics
    -   A recommended threshold is 50%-60% of the maximum batch size (currently 20) accepted by the backend
-   DO send telemetry if the last time a metric was sent was over five minutes ago

When the Publisher determines that telemetry should not be sent, it does nothing. The next outer loop should be triggered in 20 seconds.

When the Publisher determines that it should send telemetry, the “inner loop” is triggered:

-   Metrics are pulled from the queue one batch at a time, and sent to the backend
    -   The current batch size is 20, matching the service’s maximum allowed batch size.
    -   This loop continues until a stopping condition is met, including but not limited to:
        -   the queue is empty
        -   a service error is encountered (see below)
        -   a metric is determined to have had more than one transmission attempt during the current inner loop (infinite loop prevention)
        -   the telemetry system is in the “shutdown” state (see Toolkit Shutdown), indicating that a shutdown is imminent
    -   Once the inner loop has stopped:
        -   Check that the queue is not using too much memory
            -   The earliest items in the queue MUST be evicted until the size does not exceed 10,000 items
        -   Set a timer for when the next outer loop is fired
            -   By default, this is 20 seconds
            -   Error cases (below) may alter this time

When telemetry is sent to the backend, errors should be handled appropriately to help retain good metrics, while preventing a perpetual resending of bad/malformed metrics.

-   If a 4xx level http error is caught, one or more of the metrics are considered malformed/invalid. The batch MUST be discarded.
    -   This risks discarding good metrics, but you would have to resend each metric individually to filter out the ones rejected by the backend, which is not a scalable approach to take. The service may be able to find and retain good data within a batch.
    -   Implementers are responsible for ensuring the validity to metrics as they are added to the codebase.
-   If a 5xx level http error is caught, assume the backend has an issue from which it needs to recover.
    -   The batched metrics MUST be placed back on the queue. Their transmission will be reattempted later on.
    -   Stop the inner loop, and try again on the next outer loop. The next outer loop should be triggered with a back-off strategy (20 seconds \* (1 + # consecutive 5xx inner loop failures))
-   If any other type of error occurs (for example, non http related exceptions), metrics MUST be placed back on the queue. This accounts for scenarios like offline usage.
    -   Worst case: these metrics continue to round trip over the course of the Toolkit session. They would be discarded at the end of the Toolkit session.

Care must be taken to ensure that a rogue exception anywhere within the Publisher doesn’t stop the Publisher from operating. It would be unfortunate if the inner or outer loop abruptly stopped working, an unhandled exception was bubbled up to the user, or worse, the IDE fully crashed.

## User Preferences

The telemetry system MUST immediately react whenever a user changes settings to enable or disable telemetry.

When telemetry is disabled:

-   The existing queue MUST be erased
-   Whenever the toolkit makes a call to queue telemetry, the telemetry system MUST NOT place it on the queue.

-   The Telemetry Publisher MUST NOT send telemetry (see criteria under Telemetry Publisher).

When telemetry is enabled:

-   Whenever the toolkit makes a call to queue telemetry, the telemetry system MUST place it on the queue.
-   The Telemetry Publisher is permitted to send telemetry during its “outer loop” checks.

## Toolkit Shutdown

When the Toolkit is notified of a shutdown, the following events occur:

-   Start shutting down the telemetry system - the Publisher is set to a “shutdown” state, informing it to stop performing any further transmissions. If it was in the process of sending metrics batches, it stops after sending the current batch.
-   the telemetry system is disposed

## Additional Considerations

-   Toolkits being actively developed (for example, launched from the IDE in Debug mode) are RECOMMENDED to send telemetry to the beta backend instead of prod.
    -   This helps to reduce pollution in the prod backend, particularly when crafting new metrics
    -   Remember to verify that the code successfully sends data to the prod endpoints before committing changes

## Test Matrix

The team has a shared responsibility in maintaining and growing the documented test cases over time, as new scenarios are realized.

Notes:

-   Expected outcomes may involve debugger usage.
-   “Invoke a Lambda“ may be substituted with ”perform any activity that is known to generate a telemetry event“.
-   Starting state for all tests: Toolkit is started, with telemetry enabled
-   Assumption: the steps are carried out quickly, and a telemetry publisher period does not occur unless specified to wait for one

### Enable and Disable Telemetry Setting

-   The toolkit sends telemetry when this setting is enabled
    -   Steps
        -   Enable telemetry in the toolkit
        -   Invoke a Lambda
    -   Expected outcome
        -   (Debugger) Metrics are added to the queue
        -   Within five minutes, an “invoke lambda” metric will have been sent to the backend. Chances are this is written to the log, but that is an implementation detail.
-   The toolkit does not send telemetry when this setting is disabled
    -   Steps
        -   Disable telemetry in the toolkit
        -   Invoke a Lambda
    -   Expected outcome
        -   (Debugger) Metrics are not added to the queue
        -   After five minutes, no metrics will have been sent to the backend
-   Disabling Telemetry removes existing queued metrics
    -   Steps
        -   Invoke a Lambda (#1)
        -   Disable telemetry in the toolkit
        -   Invoke a Lambda (#2)
        -   Enable telemetry in the toolkit
        -   Invoke a Lambda (#3)
    -   Expected outcome
        -   (Debugger) Telemetry Queue is cleared, only the third
        -   Within five minutes, only an “invoke lambda” metric for the third invoke will have been sent to the backend.

### Sending Telemetry

-   Telemetry is sent in batches
    -   Assumptions (substitute appropriately)
        -   telemetry publisher period is 20 seconds
    -   Steps
        -   Invoke a Lambda 21 times
        -   Wait 20 seconds
    -   Expected outcome
        -   The invoke lambda events are sent, in a batch of 20, and a batch of one
-   Telemetry is sent after reaching a quantity threshold
    -   Assumptions (substitute appropriately)
        -   telemetry publisher period is 20 seconds
        -   telemetry publisher threshold is 12 items
    -   Steps
        -   Invoke a Lambda six times (#1-6)
        -   Wait 25 seconds
        -   Invoke a Lambda six more times (#7-12)
        -   Wait 20 seconds
    -   Expected outcome
        -   Telemetry was not sent after the 25 second wait
        -   All 12 “invoke Lambda” metrics are sent after the second 20 second wait (implementation detail: logs might help to verify this)
-   Telemetry is sent after reaching a time threshold
    -   Steps
        -   Invoke a Lambda
        -   Wait 5 minutes
    -   Expected outcome
        -   The “invoke Lambda” metric is sent within five minutes, with a batch size of one.

## Appendix

### Alternate Approaches

#### Persist Queue to Disk (with a variety of frequencies)

An alternate plan considered saving the queue state to disk at the end of each Publisher “outer loop”, and on toolkit shutdown. The cached contents would be published during a future Toolkit session.

Pros:

-   Retains metrics instead of discarding them. These can be sent during the next Toolkit session.

Cons:

-   Frequent disk access on the client system. This fails the Tenet around reasonable use of client system resources.
-   Increased telemetry system complexity

This approach was not chosen. We feel the known use cases for telemetry do not warrant the need to try and retain metrics.

#### Use a disk backed Queue

An alternate plan considered using a disk based queue.

Pros:

-   In the event of an uncontrolled shutdown, all (or most) metrics are retained. These can be sent during the next Toolkit session.
-   Less complexity than maintaining a persistent queue (see above alternate approach)

Cons:

-   Dramatic increase in disk access (each time the queue is pushed or popped), failing the Tenet around reasonable use of client system resources. Configuring the queue to write to disk less often diminishes the advantage of full metric retention.
-   Introduces additional points of failure. Each disk access attempt could fail, impacting the main telemetry loop. Using a third party library could introduce unknown behaviors, failing the Tenets.

-   Providing the accompanying environment details (see Storing Queued Metrics) in the persisted queue would require additional complexities.

This approach was not chosen due to the tenet failure around minimal usage of client resources. The telemetry system does not have a goal to prevent metrics loss in the event of uncontrolled shutdowns, so these trade-offs are not worth while.
