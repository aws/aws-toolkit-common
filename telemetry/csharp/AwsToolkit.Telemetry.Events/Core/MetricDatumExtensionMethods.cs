namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    public static class MetricDatumExtensionMethods
    {
        /// <summary>
        /// Add metadata to a metric datum, only if the value is non-blank
        /// </summary>
        public static void AddMetadata(this MetricDatum metricDatum, string key, string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            metricDatum.Metadata[key] = value;
        }

        /// <summary>
        /// Add metadata to a metric datum, only if the value is non-blank (object overload)
        /// </summary>
        public static void AddMetadata(this MetricDatum metricDatum, string key, object value)
        {
            if (value == null)
            {
                return;
            }

            metricDatum.AddMetadata(key, value.ToString());
        }

        /// <summary>
        /// Add metadata to a metric datum, only if the value is non-blank (bool overload)
        /// </summary>
        public static void AddMetadata(this MetricDatum metricDatum, string key, bool value)
        {
            string valueStr = "false";
            if (value)
            {
                valueStr = "true";
            }

            metricDatum.AddMetadata(key, valueStr);
        }

        /// <summary>
        /// Add metadata to a metric datum, only if the value is non-blank (double overload)
        /// </summary>
        public static void AddMetadata(this MetricDatum metricDatum, string key, double value)
        {
            metricDatum.AddMetadata(key, value.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        /// <summary>
        /// Add metadata to a metric datum, only if the value is non-blank (int overload)
        /// </summary>
        public static void AddMetadata(this MetricDatum metricDatum, string key, int value)
        {
            metricDatum.AddMetadata(key, value.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }
    }
}