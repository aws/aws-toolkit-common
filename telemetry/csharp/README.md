# C# AWS Toolkit Telemetry

This solution contains a code generator and datatypes that allow the AWS Toolkit for Visual Studio to produce and record telemetry events.

At this time, the generated code does not function in a standalone capacity. It requires datatypes (within a soon-to-be-published `Amazon.AwsToolkit.Telemetry.Events.Core` namespace). See [Roadmap](#Roadmap) for future plans in this space.

## Generator Usage

Command Line Arguments:

`--namespace`

-   The namespace to produce generated code into
-   Defaults to `Amazon.AwsToolkit.Telemetry.Events`

`-o`

-   Where to write the generated code file(s) to
-   Defaults to the current working directory

See [Options file](AwsToolkit.Telemetry.Events.Generator/Options.cs) for details.

By default, the program produces generated code into the directory where the program is run from.

## Integrating Generated code into the AWS Toolkit for Visual Studio

This project is currently not intended to be integrated into the toolkit until packages are published. See [Roadmap](#Roadmap). The steps below are provided as a workaround.

1. Sync this repo
1. Build and run AwsToolkit.Telemetry
1. Take the generated file (GeneratedCode.cs), and place it in the toolkit, as `toolkitcore/AWSToolkit.Util/Telemetry/Telemetry.generated.cs`
1. Copy over all `Amazon.AwsToolkit.Telemetry.Events.Core` files from this repo as well.

## Roadmap

-   add Generator support for supplemental telemetry definitions
-   Standalone NuGet Packages
    -   Produce and publish a package containing the telemetry SDK
    -   Produce and publish a package containing the telemetry events datatypes
    -   Produce and publish a package containing the telemetry events code generator
