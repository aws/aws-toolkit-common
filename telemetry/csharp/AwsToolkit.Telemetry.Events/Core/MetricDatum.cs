using System.Collections.Generic;

namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    public sealed class MetricDatum
    {
        public List<MetadataEntry> Metadata { get; set; } = new List<MetadataEntry>();
        public string MetricName { get; set; }
        public Unit Unit { get; set; } = Unit.None;
        public double Value { get; set; } = 0;
    }
}
