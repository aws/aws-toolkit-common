using ToolkitTelemetryGenerator.Utils;
using Xunit;

namespace ToolkitTelemetryGenerator.Tests
{
    public class StringExtensionMethodsTests
    {
        [Theory]
        [InlineData(null, "")]
        [InlineData("", "")]
        [InlineData("a", "A")]
        [InlineData("A", "A")]
        [InlineData("ab", "Ab")]
        [InlineData("Ab", "Ab")]
        [InlineData("AB", "AB")]
        [InlineData("pascalCase", "PascalCase")]
        public void ToPascalCase(string input, string expectedOutput)
        {
            Assert.Equal(expectedOutput, input.ToPascalCase());
        }
    }
}