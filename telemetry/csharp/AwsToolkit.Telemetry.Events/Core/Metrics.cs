using System;
using System.Collections.Generic;

namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    /// <summary>
    /// Generalized Telemetry information for an event.
    /// Recorded using <seealso cref="ITelemetryLogger"/>
    /// </summary>
    public sealed class Metrics
    {
        /// <summary>
        /// Timestamp to associate with all Data entries
        /// </summary>
        public DateTime CreatedOn;

        public IList<MetricDatum> Data = new List<MetricDatum>();
    }
}
