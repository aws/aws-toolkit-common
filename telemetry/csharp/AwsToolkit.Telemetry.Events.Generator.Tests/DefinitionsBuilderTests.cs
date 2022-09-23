using System.IO;
using Amazon.AwsToolkit.Telemetry.Events.Generator.Models;
using Xunit;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Tests
{
    public class DefinitionsBuilderTests
    {
        private readonly DefinitionsBuilder _sut = new DefinitionsBuilder().WithNamespace("Test");
        private readonly TelemetryDefinitions _definitions = TelemetryDefinitions.Load("test-data/sampleDefinitions.json");

        /// <summary>
        /// Treat the sample definitions as if they were the central telemetry definitions
        /// </summary>
        [Fact]
        public void Build_CommonDefinition()
        {
            _sut
                .AddMetrics(_definitions.metrics)
                .AddMetricsTypes(_definitions.types);

            AssertGeneratedCode("test-data/expectedCode.txt");
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

            AssertGeneratedCode("test-data/expectedCode-supplemental.txt");
        }

        private void AssertGeneratedCode(string expectedCodePath)
        {
            var expectedCode = File.ReadAllText(expectedCodePath);
            var re = NormalizeLineEndings(_sut.Build());
            Assert.Equal(NormalizeLineEndings(expectedCode), NormalizeLineEndings(_sut.Build()));
        }

        private string NormalizeLineEndings(string text)
        {
            return text.Replace("\r\n", "\n");
        }
    }
}