using Amazon.AwsToolkit.Telemetry.Events.Generator.Core.Models;
using Amazon.AwsToolkit.Telemetry.Events.Generator.Tests.Utils;
using FluentAssertions;
using System;
using System.IO;
using Xunit;
using GeneratorProgram = Amazon.AwsToolkit.Telemetry.Events.Generator.Program;


namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Tests.Generator
{
    public class GeneratorTests : IDisposable
    {
        private const int _timeoutMs = 15_000;

        private readonly TemporaryTestLocation _testLocation = new TemporaryTestLocation();
        private readonly TelemetryDefinitions _definitions = TelemetryDefinitions.Load("SampleData/Inputs/sampleDefinitions.json");
        private readonly string _generatedFilePath;
        private readonly string _generatedFileName = "GeneratedCode.cs";

        public GeneratorTests()
        {
            _generatedFilePath = Path.Combine(_testLocation.OutputFolder, _generatedFileName);
        }

        /// <summary>
        /// Tests that the generator processes supplemental definitions (supplementDefinitions.json) which combine with 
        /// the toolkit common telemetry definitions. This simulates producing the code as if the Toolkit repo was 
        /// generating its own supplemental definitions.
        /// </summary>
        [Fact]
        public void ProducesSupplementalDefinitions()
        {
            var options = new Options()
            {
                Namespace = "Test",
                SupplementalDefinitions = ["SampleData/Inputs/supplementDefinitions.json"],
                OutputFolder = _testLocation.OutputFolder,
                OutputFilename = _generatedFileName,
            };

            GeneratorProgram.Generate(options);
            AssertGeneratedCodeMatches(_generatedFilePath, "SampleData/Outcomes/supplementDefinitions.txt");
        }

        private void AssertGeneratedCodeMatches(string generatedFilePath, string expectedFilePath)
        {
            var generatedCode = File.ReadAllText(generatedFilePath);
            var expectedCode = File.ReadAllText(expectedFilePath);
            expectedCode.Should().Be(expectedCode);
        }

        private string NormalizeLineEndings(string text)
        {
            return text.Replace("\r\n", "\n");
        }

        public void Dispose()
        {
            _testLocation.Dispose();
        }
    }
}
