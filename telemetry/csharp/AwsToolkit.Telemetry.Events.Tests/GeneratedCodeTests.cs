using System;
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
                AwsAccount = "abcdacbdacbd",
                AwsRegion = "us-region-1",
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
            Assert.Equal(lambdaInvokeRemote.AwsAccount, datum.Metadata["awsAccount"]);
            Assert.Equal(lambdaInvokeRemote.AwsRegion, datum.Metadata["awsRegion"]);
            Assert.Equal(lambdaInvokeRemote.Runtime.Value.ToString(), datum.Metadata["runtime"]);
            Assert.Equal(lambdaInvokeRemote.Result.ToString(), datum.Metadata["result"]);
        }

        /// <summary>
        /// RecordLambdaInvokeRemote is arbitrary here, we're checking that we can override the
        /// Passive value.
        /// </summary>
        [Fact]
        public void RecordLambdaInvokeRemote_AsPassive()
        {
            var lambdaInvokeRemote = new LambdaInvokeRemote()
            {
                Passive = true,
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
            Assert.True(datum.Passive);
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

        [Fact]
        public void RecordNaturallyPassiveMetric()
        {
            var sessionStart = new SessionStart();

            _telemetryLogger.Object.RecordSessionStart(sessionStart);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("session_start", datum.MetricName);
            Assert.True(datum.Passive);
        }

        /// <summary>
        /// RecordAwsCopyArn / aws_copyArn was chosen as a sample metric that does not explicitly define a result field
        /// </summary>
        [Fact]
        public void RecordResult()
        {
            var copyArn = new AwsCopyArn()
            {
                Result = Result.Succeeded,
            };

            _telemetryLogger.Object.RecordAwsCopyArn(copyArn);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("aws_copyArn", datum.MetricName);
            Assert.True(datum.Metadata.ContainsKey("result"));
            Assert.Equal("Succeeded", datum.Metadata["result"]);
        }

        [Fact]
        public void RecordMetricWithMutationTransform()
        {
            var samInit = new SamInit()
            {
                Reason = "hello world",
            };

            _telemetryLogger.Object.RecordSamInit(samInit, TransformDuplicateReason);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("sam_init", datum.MetricName);

            Assert.True(datum.Metadata.ContainsKey("reason"));
            Assert.Equal("hello world", datum.Metadata["reason"]);
            
            Assert.True(datum.Metadata.ContainsKey("reason1"));
            Assert.Equal("hello world", datum.Metadata["reason1"]);

            Assert.True(datum.Metadata.ContainsKey("reason2"));
            Assert.Equal("HELLO WORLD", datum.Metadata["reason2"]);
        }

        [Fact]
        public void RecordMetricWithNewTransform()
        {
            var samInit = new SamInit()
            {
                Reason = "hello world",
            };

            _telemetryLogger.Object.RecordSamInit(samInit, TransformCreateNewDatum);

            Assert.NotNull(_recordedMetrics);
            _telemetryLogger.Verify(
                mock => mock.Record(_recordedMetrics),
                Times.Once
            );

            var datum = Assert.Single(_recordedMetrics.Data);
            Assert.NotNull(datum);
            Assert.Equal("sam_init", datum.MetricName);

            Assert.False(datum.Metadata.ContainsKey("reason"));
            Assert.True(datum.Metadata.ContainsKey("currentTime"));
            Assert.Single(datum.Metadata);
        }

        private MetricDatum TransformDuplicateReason(MetricDatum datum)
        {
            datum.Metadata["reason1"] = datum.Metadata["reason"];
            datum.Metadata["reason2"] = datum.Metadata["reason"].ToUpper();

            return datum;
        }

        private MetricDatum TransformCreateNewDatum(MetricDatum datum)
        {
            MetricDatum newDatum = new MetricDatum();
            newDatum.MetricName = datum.MetricName;
            newDatum.Metadata.Add("currentTime", DateTime.Now.ToShortTimeString());

            return newDatum;
        }
    }
}
