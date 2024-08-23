using System;
using System.IO;
using System.Linq;
using Amazon.AwsToolkit.Telemetry.Events.Generator.Models;
using CommandLine;
using Microsoft.CodeAnalysis;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator
{
    [Generator]
    public class Program : ISourceGenerator
    {
        //static void Main(string[] args)
        //{
        //    Options options = null;
        //    Parser.Default.ParseArguments<Options>(args)
        //        .WithParsed<Options>(o =>
        //        {
        //            if (string.IsNullOrWhiteSpace(o.OutputFolder))
        //            {
        //                o.OutputFolder = Directory.GetCurrentDirectory();
        //            }

        //            options = o;
        //        });

        //    if (options == null)
        //    {
        //        throw new Exception("Program Options are undefined or missing.");
        //    }

        //    var definitionPath = Path.Combine(GetTelemetryDefinitionsFolder(), "commonDefinitions.json");

        //    var commonDefinitions = TelemetryDefinitions.Load(definitionPath);

        //    DefinitionsBuilder builder = new DefinitionsBuilder()
        //        .WithNamespace(options.Namespace);

        //    // Generate the main telemetry definitions, or supplemental definitions
        //    if (!options.SupplementalDefinitions.Any())
        //    {
        //        // We're producing the main telemetry definitions
        //        builder
        //            .AddMetricsTypes(commonDefinitions.types)
        //            .AddMetrics(commonDefinitions.metrics);
        //    }
        //    else
        //    {
        //        // We're producing supplemental "repo-specific" definitions
        //        builder
        //            .AddMetricsTypes(commonDefinitions.types, referenceOnly: true);

        //        // Load each file, add types and metrics
        //        options.SupplementalDefinitions.Select(TelemetryDefinitions.Load)
        //            .ToList()
        //            .ForEach(definitions =>
        //            {
        //                builder
        //                    .AddMetricsTypes(definitions.types)
        //                    .AddMetrics(definitions.metrics);
        //            });
        //    }

        //    var code = builder.Build();

        //    File.WriteAllText(Path.Combine(options.OutputFolder, options.OutputFilename), code);
        //}

        public static string GetTelemetryDefinitionsFolder()
        {
            return Path.Combine(
                Path.GetDirectoryName(typeof(Program).Assembly.Location),
                "Definitions");
        }

        public void Initialize(GeneratorInitializationContext context)
        {
            //throw new NotImplementedException();
        }

        public void Execute(GeneratorExecutionContext context)
        {
            try
            {
                //var definitionPath = Path.Combine(GetTelemetryDefinitionsFolder(), "commonDefinitions.json");

                //var commonDefinitions = TelemetryDefinitions.Load(definitionPath);
                var stream = typeof(Program).Assembly.GetManifestResourceStream("Amazon.AwsToolkit.Telemetry.Events.SourceGenerator.commonDefinitions.json");
                var json = new StreamReader(stream).ReadToEnd();
                var commonDefinitions = TelemetryDefinitions.LoadFromJson(json);

                DefinitionsBuilder builder = new DefinitionsBuilder()
                    //.WithNamespace(options.Namespace);
                    .WithNamespace("Amazon.AwsToolkit.Telemetry.Events.Generated");

                // Generate the main telemetry definitions, or supplemental definitions
                //if (!options.SupplementalDefinitions.Any())
                {
                    // We're producing the main telemetry definitions
                    builder
                        .AddMetricsTypes(commonDefinitions.types)
                        .AddMetrics(commonDefinitions.metrics);

                }

                var code = builder.Build();

                // Add the source code to the compilation

                // Produces "Amazon.AwsToolkit.Telemetry.Events.GeneratedCode.g.cs"
                //context.AddSource($"{context.Compilation.AssemblyName}.GeneratedCode.g.cs", code);

                context.AddSource($"GeneratedCode.g.cs", code);

                //File.WriteAllText(Path.Combine(options.OutputFolder, options.OutputFilename), code);
            }
            catch (Exception ex)
            {
                var code = $"// Error: {ex.Message}";
                context.AddSource($"Error.GeneratedCode.g.cs", code);
            }
        }
    }
}
