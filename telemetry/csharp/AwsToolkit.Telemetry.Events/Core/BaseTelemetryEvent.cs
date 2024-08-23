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
        /// Indicates if the metric should track run-time performance information (true)
        /// or not (false).
        ///
        /// Derived classes configure this value to match the telemetry definitions.
        /// </summary>
        public bool TrackPerformance = false;

        /// <summary>
        /// Optional - The reason for a metric or exception depending on context. It describes a certain theme of errors usually the exception class name eg. FileIOException
        /// This is often used in failure scenarios to provide additional details about why something failed.
        /// </summary>
        public string Reason;

        /// <summary>
        /// Optional - User-friendly error codes describing a failed operation
        /// This is often used in failure scenarios to provide additional details about why something failed.
        /// </summary>
        public string ErrorCode;

        /// <summary>
        /// Optional - High level categorization indicating the cause of the error eg. client, user, service, unknown
        /// This is often used in failure scenarios to provide additional details about why something failed.
        /// </summary>
        public string CausedBy;

        /// <summary>
        /// Optional - Describes the HTTP status code for request made. The semantics are contextual based off of other fields (e.g. `requestId`)
        /// This is often used in failure scenarios to provide additional details about why something failed.
        /// </summary>
        public string HttpStatusCode;

        /// <summary>
        /// Optional - A generic request ID field. The semantics are contextual based off of other fields (e.g. `requestServiceType`). For example, an event with `requestServiceType: s3` means that the request ID is associated with an S3 API call. Events that cover mutliple API calls should use the request ID of the most recent call.
        /// This is often used in failure scenarios to provide additional details about why something failed.
        /// </summary>
        public string RequestId;

        /// <summary>
        /// Optional - Per-request service identifier. Unlike `serviceType` (which describes the originator of the request), this describes the request itself.
        /// This is often used in failure scenarios to provide additional details about why something failed.
        /// </summary>
        public string RequestServiceType;
        
        /// <summary>
        /// Optional - The duration for the workflow associated with the metric 
        /// This is often used in multi-step workflows to provide additional details about how long did the action take
        /// </summary>
        public double? Duration;

        /// <summary>
        /// Optional - Language-related user preference information. Examples: en-US, en-GB, etc.
        /// </summary>
        public string Locale;

        public DateTime? CreatedOn;
        public double? Value;
        public string AwsAccount;
        public string AwsRegion;
    }
}
