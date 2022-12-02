using System.Linq;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Utils
{
    public static class StringExtensionMethods
    {
        public static string ToPascalCase(this string text)
        {
            if (string.IsNullOrEmpty(text))
            {
                return string.Empty;
            }

            if (text.Length == 1)
            {
                return text.ToUpper();
            }

            var segments = text.Split("_");
            if (segments.Length > 1)
            {
                return string.Concat(segments.Select(ToPascalCase));
            }

            return $"{text[0].ToString().ToUpper()}{text.Substring(1)}";
        }
    }
}