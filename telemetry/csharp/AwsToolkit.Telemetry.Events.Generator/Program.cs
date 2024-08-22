using Amazon.AwsToolkit.Telemetry.Events.Generator.Core;
using Amazon.AwsToolkit.Telemetry.Events.Generator.Core.Models;
using CommandLine;
using System;
using System.IO;
using System.Linq;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator
{
    public class Program
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

            Generate(options);
        }

        public static void Generate(Options options)
        { 
            var definitionPath = Path.Combine(GetTelemetryDefinitionsFolder(), "commonDefinitions.json");

            var commonDefinitions = TelemetryDefinitions.Load(definitionPath);

            DefinitionsBuilder builder = new DefinitionsBuilder()
                .WithNamespace(options.Namespace);

            // Generate the main telemetry definitions, or supplemental definitions
            if (!options.SupplementalDefinitions.Any())
            {
                // We're producing the main telemetry definitions
                builder
                    .AddMetricsTypes(commonDefinitions.types)
                    .AddMetrics(commonDefinitions.metrics);
            }
            else
            {
                // We're producing supplemental "repo-specific" definitions
                builder
                    .AddMetricsTypes(commonDefinitions.types, referenceOnly: true);

                // Load each file, add types and metrics
                options.SupplementalDefinitions.Select(TelemetryDefinitions.Load)
                    .ToList()
                    .ForEach(definitions =>
                    {
                        builder
                            .AddMetricsTypes(definitions.types)
                            .AddMetrics(definitions.metrics);
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
