using System;
using System.IO;
using ToolkitTelemetryGenerator.Models;

namespace ToolkitTelemetryGenerator
{
    class Program
    {
        static void Main(string[] args)
        {
            // TODO : Command Line Options

            var definitionPath = @"Definitions\commonDefinitions.json";

            var definitions = TelemetryDefinitions.Load(definitionPath);

            DefinitionsBuilder builder = new DefinitionsBuilder()
                // TODO : Namespace
                .WithNamespace("C2Namespace")
                .AddMetrics(definitions.metrics)
                .AddMetricsTypes(definitions.types);

            var code = builder.Build();

            // TODO : Output file
            File.WriteAllText(@"..\..\..\..\GeneratedCode.cs", code);
        }
    }
}
