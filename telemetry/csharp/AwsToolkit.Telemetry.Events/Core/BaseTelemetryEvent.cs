using System;

namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    /// <summary>
    /// Parent to all classes representing events to be recorded
    /// </summary>
    public abstract class BaseTelemetryEvent
    {
        /// <summary>
        /// Indicates if the metric relates to something the user has initiated (false)
        /// or something the Toolkit may have automatically induced (true).
        /// 
        /// Derived classes configure this value to match the telemetry definitions,
        /// but this property gives calling code the opportunity to adjust if needed.
        /// </summary>
        public bool Passive = false;

        public DateTime? CreatedOn;
        public double? Value;
        public string AwsAccount;
        public string AwsRegion;
    }
}
