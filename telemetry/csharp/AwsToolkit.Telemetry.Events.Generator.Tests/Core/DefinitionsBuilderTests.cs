using Amazon.AwsToolkit.Telemetry.Events.Generator.Core.Models;
using System.IO;
using Xunit;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Core.Tests
{
    public class DefinitionsBuilderTests
    {
        private readonly DefinitionsBuilder _sut = new DefinitionsBuilder().WithNamespace("Test");
        private readonly TelemetryDefinitions _definitions = TelemetryDefinitions.Load("SampleData/Inputs/sampleDefinitions.json");

        /// <summary>
        /// Treat the sample definitions as if they were the central telemetry definitions
        /// </summary>
        [Fact]
        public void Build_CommonDefinition()
        {
            _sut
                .AddMetrics(_definitions.metrics)
                .AddMetricsTypes(_definitions.types);

            AssertGeneratedCode("SampleData/Outcomes/sampleDefinitions-generated.txt");
        }

        /// <summary>
        /// Treat the sample definitions as if they were the repo-specific "supplemental" telemetry definitions
        /// </summary>
        [Fact]
        public void Build_ReferenceDefinition()
        {
            _sut
                .AddMetrics(_definitions.metrics)
                .AddMetricsTypes(_definitions.types, referenceOnly: true);

            AssertGeneratedCode("SampleData/Outcomes/sampleDefinitions-supplemental.txt");
        }

        private void AssertGeneratedCode(string expectedCodePath)
        {
            var expectedCode = File.ReadAllText(expectedCodePath);
            Assert.Equal(NormalizeLineEndings(expectedCode), NormalizeLineEndings(_sut.Build()));
        }

        private string NormalizeLineEndings(string text)
        {
            return text.Replace("\r\n", "\n");
        }
    }
}