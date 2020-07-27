# C# AWS Toolkit Telemetry

This solution contains a code generator and datatypes that allow the AWS Toolkit for Visual Studio to produce and record telemetry events.

At this time, the generated code does not function in a standalone capacity. It requires datatypes (within a soon-to-be-published `Amazon.AwsToolkit.Telemetry.Events.Core` namespace). See [Roadmap](#Roadmap) for future plans in this space.

There are two types of telemetry definitions that serve as inputs to the code generator:

-   **Common Telemetry definitions** - Central definitions applied to all AWS Toolkit products. The AWS Toolkit for Visual Studio consumes these telemetry types through a central package (package not generated yet, see Roadmap). These definitions reside in [commonDefinitions.json](/telemetry/definitions/commonDefinitions.json).
-   **Supplemental Telemetry definitions** - definitions that are specific to one toolkit (or not necessarily applicable to all Toolkits), or definitions that are part of a to-be-released feature which that cannot be made public yet. These definitions reside in the toolkit repo, and the generator is used to produce code that is directly integrated into the toolkit. The generated code references datatypes from the common telemetry definitions, and is expected to have access to the package mentioned above.

## Generator Usage

Here is the usage information output when run with `--help`:

```
  --namespace    (Default: Amazon.AwsToolkit.Telemetry.Events) Namespace to produce generated code in. When generating code for supplemental telemetry definitions, this can help 'fit' the generated code into a
                 host codebase

  -s             Optional, space separated. Supplemental telemetry definition files. When provided, code is not generated for common telemetry definitions. This is intended for toolkit-specific telemetry
                 definitions that live in the host repo (rather than the toolkit common repo). Generated code is expected to have access to the common Telemetry Events package and namespace.

  -o             Location to write generated code to. Defaults to current folder.

  -f             (Default: GeneratedCode.cs) Name of file to produce.

  --help         Display this help screen.

  --version      Display version information.
```

See [Options file](AwsToolkit.Telemetry.Events.Generator/Options.cs) for details.

## Integrating Generated code into the AWS Toolkit for Visual Studio

This project is currently not intended to be integrated into the toolkit until packages are published. See [Roadmap](#Roadmap). The steps below are provided as a workaround.

1. Sync this repo
1. Build and run AwsToolkit.Telemetry
1. Take the generated file (GeneratedCode.cs), and place it in the toolkit, as `toolkitcore/AWSToolkit.Util/Telemetry/Telemetry.generated.cs`
1. Copy over all `Amazon.AwsToolkit.Telemetry.Events.Core` files from this repo as well.

## Roadmap

-   Standalone NuGet Packages
    -   Produce and publish a package containing the telemetry SDK
    -   Produce and publish a package containing the telemetry events datatypes
    -   Produce and publish a package containing the telemetry events code generator
