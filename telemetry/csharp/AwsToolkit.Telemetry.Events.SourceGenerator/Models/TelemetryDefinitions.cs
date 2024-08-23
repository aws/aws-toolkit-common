// ReSharper disable InconsistentNaming
//using System.IO;
using System.Linq;
using Newtonsoft.Json;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Models
{
    public class TelemetryDefinitions
    {
        public MetricType[] types { get; set; }
        public Metric[] metrics { get; set; }


        //public static TelemetryDefinitions Load(string filename)
        //{
        //    var json = File.ReadAllText(filename);

        //    return LoadFromJson(json);
        //}

        public static TelemetryDefinitions LoadFromJson(string json)
        {
            var doc = JsonConvert.DeserializeObject<TelemetryDefinitions>(json);

            // Process all metric metadata so that null "required" fields are set to true
            doc.metrics.ToList().ForEach(m => m.metadata?.ToList().ForEach(data =>
            {
                if (!data.required.HasValue)
                {
                    data.required = true;
                }
            }));

            return doc;
        }
    }
}