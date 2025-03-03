# Telemetry Format

Telemetry definitions are made up of json files that live in `definitions`. Files are merged together at build time. They output one file in the target language that can call the platform specific telemetry client.

## Format

The format is JSON object with two fields:

### Types

_types_ is an array that holds telemetry metadata types. This is the information posted to the telemetry service like
`isDebug` or `runtime`. Entries can be referenced from other files. The field is optional.

```
"types": [
   {
        "name": string,
        "description": string,
        (optional - default is "string") "type": one of "int", "double", "string", "boolean"
        (optional - default is empty = anything) "allowedValues": [ ... string array]
    },
    ...
```

**Note: typename MUST be camelCase**

### Metrics

_metrics_ is an array that contains the actual metrics posted to the service.
- `name` defines the metric name
  - it must be in the format `{namespace}_{did|will| }{verb}{Noun}` (eg: `toolkit_willOpenModule`, `toolkit_didLoadModule`, `toolkit_closeModule`)
    - This format aligns with legacy names while standardizing conventions for new names going forward, though we might have chosen differently if starting from scratch.
  - the part after the namespace must be in camelCase. `namespace_camelCaseName` (e.g. `s3_uploadObject`).
  - Common Namespaces:
    - `toolkit_` is for general non-feature-specific metrics created by the toolkit. Eg: `toolkit_openModule`
    - `ide_` is for IDE specific metrics, not controlled by our extension. Eg: `ide_openEditor`
  - NOTE: legacy metrics don't always follow the above rules, but new definitions must follow them.
- `description` explains what the metric means
  - put effort to explaining the metrics purpose in detail. This tends to be the source of truth for what the metric actually means and how it should be used.
  - if a metric is deprecated, it must be indicated here
- `metadata` contains fields (`types`) that define characteristics of the telemetry beyond `createTime` and a `value`.
  - This field is optional, but default fields (`types`) are always present on generated metrics.

```
"metrics": [
    {
        "name": string,
        "description": string,
        (optional - default is "none") "unit": one of "Milliseconds", "Bytes","Percent","Count","None"
        (optional - default is empty) "metadata": [
            "type": string (the string references a previously defined type)
            (optional - default true)"required": boolean
        ]
    },
]
```

These are then used to generate functions that take arguments pertaining to metrics.

### Global Arguments

Global properties that can annotate any telemetry event.

```javascript
// The time that the event took place
createTime: Date
// AWS account ID associated with a metric.
// - "n/a" if credentials are not available.
// - "not-set" if credentials are not selected.
// - "invalid" if account ID cannot be obtained.
awsAccount: string
// AWS Region associated with a metric.
// - "n/a" if not associated with a region.
// - "not-set" if metric is associated with a region, but region is unknown.
awsRegion: string
// The duration of the operation in milliseconds.
duration: number
// HTTP status code for the request (if any) associated with a metric.
httpStatusCode: string
// The language-related user preference information. Examples: en-US, en-GB, etc.
locale: string
// Reason code or name for an event (when result=Succeeded) or error (when result=Failed).
// Unlike the `reasonDesc` field, this should be a stable/predictable name for
// a class of events or errors (typically the exception name, e.g. FileIOException).
reason: string
// Error message detail. May contain arbitrary message details (unlike the
// `reason` field), but should be truncated (recommendation: 200 chars).
reasonDesc: string
// Request ID (if any) associated with a metric.
// For example, an event with `requestServiceType: s3` means that the request ID
// is associated with an S3 API call. Events that cover mutliple API calls
// should use the request ID of the most recent call.
requestId: string
// Per-request service identifier. Unlike `serviceType` (which describes the
// originator of the request), this describes the request itself.
requestServiceType: string
// The result of the operation.
result: Result
// Indicates that the metric was not caused by an explicit user action.
passive: boolean
// Value based on unit and call type
value: number
// Indicates that the metric should track run-time performance information
trackPerformance: boolean
// Unique identifier for the trace (a set of events) this metric belongs to
traceId: number
// Unique identifier for this metric
metricId: number
// Unique identifier of this metrics parent metric id
parentId: number
```

If not specified `createTime` defaults to UTC now, `value` defaults to `1.0`.

### Example

#### Input

```json
{
    "types": [
        {
            "name": "result",
            "allowedValues": ["Succeeded", "Failed", "Cancelled"],
            "description": "The result of the operation"
        },
        {
            "name": "runtime",
            "type": "string",
            "allowedValues": ["dotnetcore2.1", "...", "python2.7"],
            "description": "The Lambda runtime"
        },
        "..."
    ],
    "metrics": [
        {
            "name": "lambda_invokeRemote",
            "description": "Called when invoking lambdas remotely",
            "metadata": [{ "type": "runtime" }, { "type": "result" }]
        },
        "..."
    ]
}
```

#### Output

```typescript
interface LambdaRemoteinvoke {
    // The Lambda runtime
    runtime: runtime
    // The result of the operation
    result: result
    // The time that the event took place,
    createTime?: Date
    // Value based on unit and call type,
    value?: number
    // The AWS account ID associated with a metric
    awsAccount?: string
    // The AWS Region associated with a metric
    awsRegion?: string
}

/**
 * called when invoking lambdas remotely
 * @param args See the LambdaRemoteinvoke interface
 * @returns Nothing
 */
export function recordLambdaRemoteinvoke(args: LambdaRemoteinvoke) {
    globals.telemetry.record({
        createTime: args?.createTime ?? new globals.clock.Date(),
        data: [
            {
                MetricName: 'lambda_invokeRemote',
                Value: args?.value ?? 1,
                Unit: 'None',
                Metadata: [
                    { Key: 'awsAccount', Value: args.awsAccount ?? '' },
                    { Key: 'awsRegion', Value: args.awsRegion ?? '' },
                    { Key: 'runtime', Value: args.runtime?.toString() ?? '' },
                    { Key: 'result', Value: args.result?.toString() ?? '' }
                ]
            }
        ]
    })
}
```
