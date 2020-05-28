namespace ToolkitTelemetryGenerator.Models
{
    public class Metric
    {
        public string name { get; set; }
        public string description { get; set; }
        public Metadata[] metadata { get; set; }
        public string unit { get; set; }
    }
}