using Amazon.AwsToolkit.Telemetry.Events.Core;
using Amazon.AwsToolkit.Telemetry.Events.Tests.Generated;
using Moq;
using Xunit;

namespace Amazon.AwsToolkit.Telemetry.Events.Tests
{
    /// <summary>
    /// Test a sampling of the auto-generated code for supplemental telemetry definitions,
    /// to see that RecordXxx calls function as expected
    /// </summary>
    public class GeneratedSupplementCodeTests
    {
        private readonly Mock<ITelemetryLogger> _telemetryLogger = new Mock<ITelemetryLogger>();
        private Metrics _recordedMetrics = null;

        public GeneratedSupplementCodeTests()
        {
            _telemetryLogger.Setup(mock => mock.Record(It.IsAny<Metrics>()))
                .Callback<Metrics>(metrics =>
                {
                    _recordedMetrics = metrics;
                });
        }

        /// <summary>
        /// RecordSampleExtendedInvoke was chosen as a sample call that uses both a
        /// common telemetry type (Runtime) and a supplemental telemetry type (ExtendedRuntime).
        /// </summary>
        [Fact]
        public void RecordSampleExtendedInvoke()
        {
            var payload = new SampleExtendedInvoke()
            {
                Result = Result.Succeeded,
                Runtime = Runtime.Dotnetcore31,
                ExtendedRuntime = ExtendedRuntime.Rascal,
            };

            _telemetryLogger.Object.RecordSampleExtendedInvoke(payload);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("sample_extendedInvoke", datum.MetricName);
            Assert.Equal(Unit.None, datum.Unit);
            Assert.Equal(payload.Runtime.Value.ToString(), datum.Metadata["runtime"]);
            Assert.Equal(payload.ExtendedRuntime.Value.ToString(), datum.Metadata["extendedRuntime"]);
            Assert.Equal(payload.Result.ToString(), datum.Metadata["result"]);
        }

        /// <summary>
        /// RecordSampleReleaseBees was chosen as a sample call that uses 
        /// only supplemental telemetry types.
        /// </summary>
        [Fact]
        public void RecordSampleReleaseBees()
        {
            var payload = new SampleReleaseBees()
            {
                Bees = 123,
            };

            _telemetryLogger.Object.RecordSampleReleaseBees(payload);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("sample_releaseBees", datum.MetricName);
            Assert.Equal(Unit.None, datum.Unit);
            Assert.Equal(payload.Bees.ToString(), datum.Metadata["bees"]);
        }

        /// <summary>
        /// Sample test using a Unit (which is part of the common telemetry declarations).
        /// </summary>
        [Fact]
        public void RecordSampleTestRun()
        {
            var payload = new SampleTestRun()
            {
                Value = 2.4,
            };

            _telemetryLogger.Object.RecordSampleTestRun(payload);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("sample_testRun", datum.MetricName);
            Assert.Equal(Unit.Milliseconds, datum.Unit);
            Assert.Equal(payload.Value.Value, datum.Value);
        }
    }
}
