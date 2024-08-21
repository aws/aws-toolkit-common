using Amazon.AwsToolkit.Telemetry.Events.Core;

namespace Amazon.AwsToolkit.Telemetry.Events.Generated
{

    /// <summary>
    /// This class serves as a "shim" for metadata properties defined as global, but whose types are also 
    /// defined. Global types should have probably been kept as primitive types, but now we 
    /// wish to maintain compatibility within the Toolkit code that consumes this package.
    /// 
    /// Global properties: https://github.com/aws/aws-toolkit-common/blob/main/telemetry/telemetryformat.md#global-arguments
    /// </summary>
    public abstract class BaseGeneratedTelemetryEvent : BaseTelemetryEvent
    {
        /// <summary>
        /// The result of the operation
        /// </summary>
        /// <remarks>
        /// The Result type is defined in https://github.com/aws/aws-toolkit-common/blob/main/telemetry/definitions/commonDefinitions.json
        /// alongside the metrics which we generate as derived classes.
        /// </remarks>
        public Result? Result;
    }
}
