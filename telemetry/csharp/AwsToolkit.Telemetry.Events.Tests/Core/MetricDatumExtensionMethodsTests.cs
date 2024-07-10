using Amazon.AwsToolkit.Telemetry.Events.Core;
using FluentAssertions;
using System;
using Xunit;

namespace Amazon.AwsToolkit.Telemetry.Events.Tests.Core
{
    public class MetricDatumExtensionMethodsTests
    {
        private readonly MetricDatum _sut = new MetricDatum();
        private const string Key = "sampleKey";

        [Fact]
        public void AddMetadata_NonBlankEntries()
        {
            _sut.AddMetadata(Key, "hello");
            _sut.Metadata[Key].Should().Be("hello");

            _sut.AddMetadata(Key, 123);
            _sut.Metadata[Key].Should().Be("123");

            _sut.AddMetadata(Key, 123.456);
            _sut.Metadata[Key].Should().Be("123.456");

            _sut.AddMetadata(Key, 88.88d);
            _sut.Metadata[Key].Should().Be("88.88");

            _sut.AddMetadata(Key, true);
            _sut.Metadata[Key].Should().Be("true");

            _sut.AddMetadata(Key, false);
            _sut.Metadata[Key].Should().Be("false");
        }

        [Fact]
        public void AddMetadata_BlankEntries()
        {
            _sut.AddMetadata(Key, (object) null);
            _sut.Metadata.Should().NotContainKey(Key);

            _sut.AddMetadata(Key, (string) null);
            _sut.Metadata.Should().NotContainKey(Key);

            _sut.AddMetadata(Key, string.Empty);
            _sut.Metadata.Should().NotContainKey(Key);

            _sut.AddMetadata(Key, "   ");
            _sut.Metadata.Should().NotContainKey(Key);
        }

        [Fact]
        public void InvokeTransform_Null()
        {
            var updatedDatum = _sut.InvokeTransform(null);
            _sut.Should().BeSameAs(updatedDatum);
        }

        [Fact]
        public void InvokeTransform_Throws()
        {
            MetricDatum TransformFunction(MetricDatum datum)
            {
                throw new ArgumentException("sample transform exception");
            }

            var updatedDatum = _sut.InvokeTransform(TransformFunction);
            updatedDatum.Should().NotBeNull();
        }

        [Fact]
        public void InvokeTransform()
        {
            MetricDatum TransformFunction(MetricDatum datum)
            {
                datum.AddMetadata(Key, "hello");
                return datum;
            }

            var updatedDatum = _sut.InvokeTransform(TransformFunction);
            updatedDatum.Metadata[Key].Should().Be("hello");
        }
    }
}