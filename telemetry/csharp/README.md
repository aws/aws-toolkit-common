# C# AWS Toolkit Telemetry Generator

This generator produces code that generates and records telemetry events. It is intended for use in C# systems like the AWS Toolkit for Visual Studio.

At this time, the generated code does not function in a standalone capacity. It requires datatypes (within a `Amazon.ToolkitTelemetry` namespace) that are produced when an SDK-style Telemetry Client is generated. This code lives within the Toolkit repo at this time. See Roadmap for future plans in this space.

## Generator Usage

Command Line Arguments:

`--namespace`

-   The namespace to produce generated code into
-   Defaults to `Amazon.AWSToolkit.Telemetry`

`-o`

-   Where to write the generated code file(s) to
-   Defaults to the current working directory

See [Options file](AwsToolkit.Telemetry.Events.Generator/Options.cs) for details.

By default, the program produces generated code into the directory where the program is run from.

## Integrating Generated code into the AWS Toolkit for Visual Studio

1. Sync this repo
1. Build and run AwsToolkit.Telemetry
1. Take the generated file (GeneratedCode.cs), and place it in the toolkit, as `toolkitcore/AWSToolkit.Util/Telemetry/Telemetry.generated.cs`

## Roadmap

-   Standalone NuGet Package
    -   Produce a package that contains the auto generated Telemetry Client and auto generated methods that record Telemetry Events
