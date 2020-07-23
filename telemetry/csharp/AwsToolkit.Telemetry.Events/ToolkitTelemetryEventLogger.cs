using log4net;

namespace Amazon.AwsToolkit.Telemetry.Events
{
    public static partial class ToolkitTelemetryEvent
    {
        private static readonly ILog Logger = LogManager.GetLogger(typeof(ToolkitTelemetryEvent));
    }
}