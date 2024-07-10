using System;
using System.Diagnostics;
using log4net;

namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    public static class MetricDatumExtensionMethods
    {
        private static readonly ILog Logger = LogManager.GetLogger(typeof(MetricDatumExtensionMethods));

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
        /// Add metadata to a metric datum, only if the value is non-blank (object overload).
        /// 
        /// The main use-case for this method is the auto-generated code which provides 
        /// strongly typed telemetry events emission.
        /// 
        /// If you are explicitly calling this method and you have objects that could be any type, 
        /// you should use the overload which accepts 'detectPrimitiveType'. An example of this
        /// would be to deserialize some JSON content, which contains properties that could be 
        /// a variety of types, but are handled as type object.
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
        /// Add metadata to a metric datum, only if the value is non-blank (object overload)
        /// When requested, this overload will route primitive values like numerics to their specific handling, instead of 
        /// using the default object ToString call. This avoids performing locale specific convertsions.
        /// </summary>
        public static void AddMetadata(this MetricDatum metricDatum, string key, object value, bool detectPrimitiveType)
        {
            if (value == null)
            {
                return;
            }

            if (!detectPrimitiveType)
            {
                metricDatum.AddMetadata(key, value.ToString());
            }

            switch (value)
            {
                case bool boolValue:
                    metricDatum.AddMetadata(key, boolValue);
                    break;
                case int intValue:
                    metricDatum.AddMetadata(key, intValue);
                    break;
                case double doubleValue:
                    metricDatum.AddMetadata(key, doubleValue);
                    break;
                case long longValue:
                    metricDatum.AddMetadata(key, longValue);
                    break;
                case float floatValue:
                    metricDatum.AddMetadata(key, floatValue);
                    break;
                case decimal decimalValue:
                    metricDatum.AddMetadata(key, decimalValue);
                    break;
                default:
                    metricDatum.AddMetadata(key, value.ToString());
                    break;
            }
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

        /// <summary>
        /// Add metadata to a metric datum, only if the value is non-blank (long overload)
        /// </summary>
        public static void AddMetadata(this MetricDatum metricDatum, string key, long value)
        {
            metricDatum.AddMetadata(key, value.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        /// <summary>
        /// Add metadata to a metric datum, only if the value is non-blank (float overload)
        /// </summary>
        public static void AddMetadata(this MetricDatum metricDatum, string key, float value)
        {
            metricDatum.AddMetadata(key, value.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        /// <summary>
        /// Add metadata to a metric datum, only if the value is non-blank (decimal overload)
        /// </summary>
        public static void AddMetadata(this MetricDatum metricDatum, string key, decimal value)
        {
            metricDatum.AddMetadata(key, value.ToString(System.Globalization.CultureInfo.InvariantCulture));
        }

        /// <summary>
        /// If the transform function isn't null, invoke it and assign metric datum to it's result
        /// </summary>
        public static MetricDatum InvokeTransform(this MetricDatum metricDatum, Func<MetricDatum, MetricDatum> transformDatum = null)
        {
            try
            {
                if (transformDatum != null)
                {
                    metricDatum = transformDatum.Invoke(metricDatum);
                }
            }
            catch (Exception e)
            {
                Logger.Error("Error invoking transform function", e);
                Debug.Assert(!Debugger.IsAttached, "Error invoking transform function");
            }

            return metricDatum;
        }
    }
}