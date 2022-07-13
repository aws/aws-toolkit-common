using log4net;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    /// <summary>
    /// Implementations are responsible for handling received Telemetry Metrics
    /// (for example, sending them to a backend).
    /// </summary>
    public interface ITelemetryLogger
    {
        ILog Logger { get; }

        /// <summary>
        /// Records Telemetry information for handling
        /// </summary>
        /// <param name="metrics">Information relating to one or more Events to be handled</param>
        void Record(Metrics metrics);

        /// <summary>
        /// Sends feedback information
        /// </summary>
        /// <param name="sentiment">feedback sentiment e.g positive/negative</param>
        /// <param name="comment">feedback comment</param>
        /// <param name="metadata">additional feedback metadata</param>
        Task SendFeedback(Sentiment sentiment, string comment, IDictionary<string, string> metadata);
    }
}