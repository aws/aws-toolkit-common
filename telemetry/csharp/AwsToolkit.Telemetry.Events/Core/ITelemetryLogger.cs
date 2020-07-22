namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    /// <summary>
    /// Implementations are responsible for handling received Telemetry Metrics
    /// (for example, sending them to a backend).
    /// </summary>
    public interface ITelemetryLogger
    {
        /// <summary>
        /// Records Telemetry information for handling
        /// </summary>
        /// <param name="metrics">Information relating to one or more Events to be handled</param>
        void Record(Metrics metrics);
    }
}