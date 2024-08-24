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

        private static class AdditionalFilesPropertyNames
        {
            public const string Namespace = "build_metadata.AdditionalFiles.Telemetry_SrcGen_Namespace";
        }

        public static string GetTelemetryDefinitionsFolder()
        {
            return Path.Combine(
                Path.GetDirectoryName(typeof(Program).Assembly.Location),
                "Definitions");
        }

        public void Initialize(GeneratorInitializationContext context)
        {
            //System.Diagnostics.Debugger.Launch();
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
                //context.AddSource($"GeneratedCode.g.cs", code);


                // TODO: Temp: Experimental code.
                // We should make one "internal" sourcegenerator to populate the "core" events into Telemetry.Events
                // Then we make the public, packageable sourcegenerator that produces the supplemental definitions
                // (this is what would be added to the Toolkit).
                // For now this class operates makes these mutually exclusive
                // Below is the supplemental generation.

                bool skipMainGeneratedCode = false;
                /////// --- supplemental ---
                foreach (var file in context.AdditionalFiles)
                {
                    var fileOptions = context.AnalyzerConfigOptions.GetOptions(file);

                    if (!fileOptions.TryGetValue(AdditionalFilesPropertyNames.Namespace, out var outputNamespace))
                    {
                        continue;
                    }

                    var fileJson = file.GetText().ToString();

                    DefinitionsBuilder afBuilder = new DefinitionsBuilder()
                           .WithNamespace(outputNamespace);

                    // We're producing supplemental "repo-specific" definitions
                    afBuilder
                        .AddMetricsTypes(commonDefinitions.types, referenceOnly: true);

                    var fileDefinitions = TelemetryDefinitions.LoadFromJson(fileJson);

                    afBuilder
                        .AddMetricsTypes(fileDefinitions.types)
                        .AddMetrics(fileDefinitions.metrics);

                    var fileCode = afBuilder.Build();
                        
                    context.AddSource($"{Path.GetFileNameWithoutExtension(file.Path)}.g.cs", fileCode);
                    skipMainGeneratedCode = true;
                }

                if (!skipMainGeneratedCode)
                {
                    context.AddSource($"GeneratedCode.g.cs", code);
                }
            }
            catch (Exception ex)
            {
                var code = $"// Error: {ex.Message}";
                context.AddSource($"Error.GeneratedCode.g.cs", code);
            }
        }
    }
}
