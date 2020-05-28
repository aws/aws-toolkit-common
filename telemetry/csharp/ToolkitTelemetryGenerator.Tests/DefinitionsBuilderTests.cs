using System.IO;
using ToolkitTelemetryGenerator.Models;
using Xunit;

namespace ToolkitTelemetryGenerator.Tests
{
    public class DefinitionsBuilderTests
    {
        private DefinitionsBuilder _sut = new DefinitionsBuilder().WithNamespace("Test");
        
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