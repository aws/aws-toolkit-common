using System;
using System.IO;
using System.Linq;
using Amazon.AwsToolkit.Telemetry.Events.Generator.Models;
using CommandLine;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator
{
    class Program
    {
        static void Main(string[] args)
        {
            Options options = null;
            Parser.Default.ParseArguments<Options>(args)
                .WithParsed<Options>(o =>
                {
                    if (string.IsNullOrWhiteSpace(o.OutputFolder))
                    {
                        o.OutputFolder = Directory.GetCurrentDirectory();
                    }

                    options = o;
                });

            if (options == null)
            {
                throw new Exception("Program Options are undefined or missing.");
            }

            var definitionPath = Path.Combine(GetTelemetryDefinitionsFolder(), "commonDefinitions.json");

            var definitions = TelemetryDefinitions.Load(definitionPath);

            DefinitionsBuilder builder = new DefinitionsBuilder()
                .WithNamespace(options.Namespace);

            builder
                .AddMetricsTypes(definitions.types)
                .AddMetrics(definitions.metrics);

            // Generate the main telemetry definitions, or supplemental definitions
            if (!options.SupplementalDefinitions.Any())
            {
                // builder
                    // .AddMetricsTypes(definitions.types)
                    // .AddMetrics(definitions.metrics);
            }
            else
            {
                // Load each file, add types and metrics
                options.SupplementalDefinitions.Select(TelemetryDefinitions.Load)
                    .ToList()
                    .ForEach(telemetryDefinitions =>
                    {
                        builder
                            .AddMetricsTypes(telemetryDefinitions.types)
                            .AddMetrics(telemetryDefinitions.metrics);
                    });
            }

            var code = builder.Build();

            File.WriteAllText(Path.Combine(options.OutputFolder, options.OutputFilename), code);
        }

        public static string GetTelemetryDefinitionsFolder()
        {
            return Path.Combine(
                Path.GetDirectoryName(typeof(Program).Assembly.Location),
                "Definitions");
        }
    }
}
