using Amazon.AwsToolkit.Telemetry.Events.Generator.Utils;
using Xunit;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Tests
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
        [InlineData("underscore_pascalCase", "UnderscorePascalCase")]
        public void ToPascalCase(string input, string expectedOutput)
        {
            Assert.Equal(expectedOutput, input.ToPascalCase());
        }
    }
}