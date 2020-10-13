using Amazon.AwsToolkit.Telemetry.Events.Core;
using Amazon.AwsToolkit.Telemetry.Events.Generated;
using Moq;
using Xunit;

namespace Amazon.AwsToolkit.Telemetry.Events.Tests
{
    /// <summary>
    /// Test a sampling of the generated code, to see that RecordXxx calls function as expected
    /// </summary>
    public class GeneratedCodeTests
    {
        private readonly Mock<ITelemetryLogger> _telemetryLogger = new Mock<ITelemetryLogger>();
        private Metrics _recordedMetrics = null;

        public GeneratedCodeTests()
        {
            _telemetryLogger.Setup(mock => mock.Record(It.IsAny<Metrics>()))
                .Callback<Metrics>(metrics =>
                {
                    _recordedMetrics = metrics;
                });
        }

        /// <summary>
        /// RecordLambdaInvokeRemote was chosen as a sample call that uses a telemetry "enum" type (Runtime)
        /// </summary>
        [Fact]
        public void RecordLambdaInvokeRemote()
        {
            var lambdaInvokeRemote = new LambdaInvokeRemote()
            {
                Result = Result.Succeeded,
                Runtime = Runtime.Dotnetcore31,
            };

            _telemetryLogger.Object.RecordLambdaInvokeRemote(lambdaInvokeRemote);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("lambda_invokeRemote", datum.MetricName);
            Assert.Equal(Unit.None, datum.Unit);
            Assert.False(datum.Passive);
            Assert.Equal(lambdaInvokeRemote.Runtime.Value.ToString(), datum.Metadata["runtime"]);
            Assert.Equal(lambdaInvokeRemote.Result.ToString(), datum.Metadata["result"]);
        }

        /// <summary>
        /// RecordSamDeployWithVersion was chosen as a sample call that has an optional field (Version)
        /// </summary>
        [Fact]
        public void RecordSamDeployWithVersion()
        {
            var samDeploy = new SamDeploy()
            {
                Result = Result.Succeeded,
                Version = "1.2.3",
            };

            _telemetryLogger.Object.RecordSamDeploy(samDeploy);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("sam_deploy", datum.MetricName);
            Assert.Equal(Unit.None, datum.Unit);
            Assert.False(datum.Passive);
            Assert.Equal(samDeploy.Version, datum.Metadata["version"]);
            Assert.Equal(samDeploy.Result.ToString(), datum.Metadata["result"]);
        }

        /// <summary>
        /// RecordSamDeployWithVersion was chosen as a sample call that has an optional field (Version)
        /// </summary>
        [Fact]
        public void RecordSamDeployWithoutVersion()
        {
            var samDeploy = new SamDeploy()
            {
                Result = Result.Succeeded,
            };

            _telemetryLogger.Object.RecordSamDeploy(samDeploy);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("sam_deploy", datum.MetricName);
            Assert.Equal(Unit.None, datum.Unit);
            Assert.False(datum.Passive);
            Assert.False(datum.Metadata.ContainsKey("version"));
            Assert.Equal(samDeploy.Result.ToString(), datum.Metadata["result"]);
        }
    }
}
