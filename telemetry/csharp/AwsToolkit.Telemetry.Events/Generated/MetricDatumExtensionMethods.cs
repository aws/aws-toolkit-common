using Amazon.AwsToolkit.Telemetry.Events.Core;
using log4net;

namespace Amazon.AwsToolkit.Telemetry.Events.Generated
{
    public static class MetricDatumExtensionMethods
    {
        private static readonly ILog Logger = LogManager.GetLogger(typeof(MetricDatumExtensionMethods));

        /// <summary>
        /// TODO : UPDATE ME
        /// 
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
        public static void AddResultToMetadata(this MetricDatum metricDatum, Result? value)
        {
            if (value == null)
            {
                return;
            }

            metricDatum.AddMetadata("result", value.Value.ToString());
        }
    }
}