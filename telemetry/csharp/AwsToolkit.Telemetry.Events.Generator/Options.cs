using System.Collections.Generic;
using CommandLine;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator
{
    public class Options
    {
        public const string DefaultEventsNamespace = "Amazon.AwsToolkit.Telemetry.Events";

        [Option(
            Default = DefaultEventsNamespace,
            Required = false,
            HelpText = "Namespace to produce generated code in. When generating code for supplemental " +
                       "telemetry definitions, this can help 'fit' the generated code into a host codebase"
            )]
        public string Namespace { get; set; }

        [Option(
            shortName:'s',
            Required = false,
            HelpText = "Optional, space separated. Supplemental telemetry definition files. " +
                       "When provided, code is not generated for common telemetry definitions. " +
                       "This is intended for toolkit-specific telemetry definitions that live " +
                       "in the host repo (rather than the toolkit common repo). Generated code " +
                       "is expected to have access to the common Telemetry Events package and namespace."
        )]
        public IEnumerable<string> SupplementalDefinitions { get; set; }

        [Option(
            shortName:'o',
            Required = false,
            HelpText = "Location to write generated code to. Defaults to current folder."
            )]
        public string OutputFolder { get; set; }

        [Option(
            shortName: 'f',
            Default = "GeneratedCode.cs",
            Required = false,
            HelpText = "Name of file to produce."
        )]
        public string OutputFilename { get; set; }
    }
}