using CommandLine;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator
{
    public class Options
    {
        [Option(
            Default = "Amazon.AWSToolkit.Telemetry",
            Required = false,
            HelpText = "Namespace to produce generated code in"
            )]
        public string Namespace { get; set; }

        [Option(
            shortName:'o',
            Required = false,
            HelpText = "Location to write generated code to. Defaults to current folder."
            )]
        public string OutputFolder { get; set; }
    }
}