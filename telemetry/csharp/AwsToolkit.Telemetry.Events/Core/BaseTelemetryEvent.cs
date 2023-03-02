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
        /// Derived classes configure this value to match the telemetry definitions.
        /// Most metrics are intended to be passive or active, but some can be both,
        /// this property gives calling code the opportunity to adjust if needed.
        /// </summary>
        public bool Passive = false;

        /// <summary>
        /// Optional - The reason for a metric or exception depending on context
        /// This is often used in failure scenarios to provide additional details about why something failed.
        /// </summary>
        public string Reason;

        /// <summary>
        /// Optional - The duration for the workflow associated with the metric 
        /// This is often used in multi-step workflows to provide additional details about how long did the action take
        /// </summary>
        public double? Duration;

        public DateTime? CreatedOn;
        public double? Value;
        public string AwsAccount;
        public string AwsRegion;
    }
}
