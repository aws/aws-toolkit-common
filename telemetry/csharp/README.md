# C# AWS Toolkit Telemetry

## Telemetry SDK (AwsToolkit.Telemetry.SDK)

This is the SDK client used by the Toolkit to send telemetry events to the backend service.

The backend service is defined in the [service definition file](/telemetry/service/service-model.json). The [AWS SDK for .Net](https://github.com/aws/aws-sdk-net) service generator is used with the service definition file to produce SDK client code. The client code is then placed in a project (AwsToolkit.Telemtry.SDK) that is compatible for use with the Toolkit.

To generate the client code, run:

```
msbuild TelemetryClient.proj
```

Afterwards, the `AwsToolkit.Telemetry.SDK` solution can be built.

The SDK Generator code is pinned to a release tag, so that changes in the SDK repo do not have an unexpected impact in the Telemetry CI/CD.

### Updating the AWSSDK version used

When the toolkit is updated to use a newer version of the AWSSDK, it may be necessary to update the version used by `AwsToolkit.Telemetry.SDK`. Perform the following steps:

-   Determine which version of `AWSSDK.Core` you need ([NuGet](https://www.nuget.org/packages/AWSSDK.Core/), [SDK Changelog](https://github.com/aws/aws-sdk-net/blob/master/SDK.CHANGELOG.md)), then look up the corresponding [release tag](https://github.com/aws/aws-sdk-net/tags).
-   If necessary, update the tag of the SDK Generator source used. This is the `DotNetSdkTag` value in [TelemetryClient.proj](/telemetry/csharp/TelemetryClient.proj).
-   Update the `AWSSDK.Core` version used by [AwsToolkit.Telemetry.SDK.csproj](/telemetry/csharp/AwsToolkit.Telemetry.SDK/AwsToolkit.Telemetry.SDK.csproj) by updating the appropriate `PackageReference` Version.
-   Update the `AWSSDK.Core` dependency used by the [NuGet package](/telemetry/csharp/AwsToolkit.Telemetry.SDK/AwsToolkit.Telemetry.SDK.nuspec) by updating the appropriate `dependency` version.

## Telemetry Events (AwsToolkit.Telemetry.Events) and Generator (AwsToolkit.Telemetry.Events.Generator)

The `AwsToolkit.Telemetry.sln` solution contains a code generator and datatypes that allow the AWS Toolkit for Visual Studio to produce and record telemetry events.

At this time, the generated code does not function in a standalone capacity. It requires datatypes (present in the `Amazon.AwsToolkit.Telemetry.Events.Core` namespace). 

To produce a NuGet package ```Amazon.AwsToolkit.Telemetry.Events``` containing Telemetry event code and supporting datatypes, run:

```
msbuild TelemetryPackage.proj /p:Configuration:Release /p:Version=$(VERSION)
```

See [Roadmap](#Roadmap) for future plans in this space.

There are two types of telemetry definitions that serve as inputs to the code generator:

-   **Common Telemetry definitions** - Central definitions applied to all AWS Toolkit products. The AWS Toolkit for Visual Studio consumes these telemetry types through a central package (package not generated yet, see Roadmap). These definitions reside in [commonDefinitions.json](/telemetry/definitions/commonDefinitions.json).
-   **Supplemental Telemetry definitions** - definitions that are specific to one toolkit (or not necessarily applicable to all Toolkits), or definitions that are part of a to-be-released feature which that cannot be made public yet. These definitions reside in the toolkit repo, and the generator is used to produce code that is directly integrated into the toolkit. The generated code references datatypes from the common telemetry definitions, and is expected to have access to the package mentioned above.

As an example, the common telemetry definitions contains a type called `result`, which some events use in their metadata to indicate whether an operation succeeded or failed. A toolkit could have a supplemental telemetry definition which also makes use of the same `result` type. Running the generator against the supplemental definitions would not produce code for the `result` type, because it exists in the code that was produced for the common definitions.

### Generator Usage

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

### Integrating Generated code into the AWS Toolkit for Visual Studio

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
