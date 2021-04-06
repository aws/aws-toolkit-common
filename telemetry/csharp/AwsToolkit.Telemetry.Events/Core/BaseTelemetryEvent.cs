using System;

namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    /// <summary>
    /// Parent to all classes representing events to be recorded
    /// </summary>
    public abstract class BaseTelemetryEvent
    {
        public DateTime? CreatedOn;
        public double? Value;
        public string AwsAccount;
        public string AwsRegion;
    }
}
