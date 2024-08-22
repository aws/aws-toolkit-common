// ReSharper disable InconsistentNaming
namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Models
{
    public class Metric
    {
        public string name { get; set; }
        public string description { get; set; }
        public Metadata[] metadata { get; set; }
        public string unit { get; set; }
        public bool passive { get; set; }
        public bool trackPerformance { get; set; }
    }
}