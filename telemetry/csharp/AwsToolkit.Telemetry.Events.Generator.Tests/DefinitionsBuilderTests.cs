using System.IO;
using Amazon.AwsToolkit.Telemetry.Events.Generator.Models;
using Xunit;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Tests
{
    public class DefinitionsBuilderTests
    {
        private readonly DefinitionsBuilder _sut = new DefinitionsBuilder().WithNamespace("Test");
        
        [Fact]
        public void Build()
        {
            LoadDefinitions("sampleDefinitions.json");
            AssertGeneratedCode("expectedCode.txt");
        }

        private void LoadDefinitions(string path)
        {
            var definitions = TelemetryDefinitions.Load(path);

            _sut
                .AddMetrics(definitions.metrics)
                .AddMetricsTypes(definitions.types);
        }

        private void AssertGeneratedCode(string expectedCodePath)
        {
            var expectedCode = File.ReadAllText(expectedCodePath);
            Assert.Equal(expectedCode, _sut.Build());
        }
    }
}