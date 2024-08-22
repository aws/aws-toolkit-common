using System.Collections.Generic;

namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    public sealed class MetricDatum
    {
        public IDictionary<string, string> Metadata { get; } = new Dictionary<string, string>();
        public string MetricName { get; set; }
        public Unit Unit { get; set; } = Unit.None;
        public double Value { get; set; } = 0;
        public bool Passive { get; set; } = false;
        public bool TrackPerformance { get; set; } = false;
    }
}
