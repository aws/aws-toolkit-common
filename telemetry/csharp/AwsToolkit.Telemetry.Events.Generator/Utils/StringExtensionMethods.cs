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

            return $"{text[0].ToString().ToUpper()}{text.Substring(1)}";
        }
    }
}