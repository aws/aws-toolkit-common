namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    public class MetadataValue
    {
        /// <summary>
        /// Metadata property is not relevant to a metric
        /// </summary>
        public const string NotApplicable = "n/a";

        /// <summary>
        /// The value for a metric property has not been set
        /// (For example, there are no active credentials, so we don't know the Account ID)
        /// </summary>
        public const string NotSet = "not-set";

        /// <summary>
        /// The value for a metric property could not be obtained due to error
        /// </summary>
        public const string Invalid = "invalid";
    }
}