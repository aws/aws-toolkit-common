namespace ToolkitTelemetryGenerator.Utils
{
    public static class StringExtensionMethods
    {
        public static string ToCamelCase(this string text)
        {
            return $"{text[0].ToString().ToUpper()}{text.Substring(1)}";
        }
    }
}