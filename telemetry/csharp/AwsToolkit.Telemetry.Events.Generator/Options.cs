using System.Collections.Generic;
using CommandLine;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator
{
    public class Options
    {
        [Option(
            Default = "Amazon.AwsToolkit.Telemetry.Events",
            Required = false,
            HelpText = "Namespace to produce generated code in"
            )]
        public string Namespace { get; set; }

        [Option(
            shortName:'s',
            Required = false,
            HelpText = "Optional, space separated. Supplemental telemetry definition files. When provided, the common definitions are not generated."
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
            HelpText = "Name of file to produce"
        )]
        public string OutputFilename { get; set; }
    }
}