﻿using System;
using Amazon.AwsToolkit.Telemetry.Events.Core;
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
            Assert.Equal("hello", _sut.Metadata[Key]);

            _sut.AddMetadata(Key, 123);
            Assert.Equal("123", _sut.Metadata[Key]);

            _sut.AddMetadata(Key, 123.456);
            Assert.Equal("123.456", _sut.Metadata[Key]);

            _sut.AddMetadata(Key, 88.88d);
            Assert.Equal("88.88", _sut.Metadata[Key]);

            _sut.AddMetadata(Key, true);
            Assert.Equal("true", _sut.Metadata[Key]);

            _sut.AddMetadata(Key, false);
            Assert.Equal("false", _sut.Metadata[Key]);
        }

        [Fact]
        public void AddMetadata_BlankEntries()
        {
            _sut.AddMetadata(Key, (object) null);
            Assert.False(_sut.Metadata.ContainsKey(Key));

            _sut.AddMetadata(Key, (string) null);
            Assert.False(_sut.Metadata.ContainsKey(Key));

            _sut.AddMetadata(Key, string.Empty);
            Assert.False(_sut.Metadata.ContainsKey(Key));

            _sut.AddMetadata(Key, "   ");
            Assert.False(_sut.Metadata.ContainsKey(Key));
        }

        [Fact]
        public void InvokeTransform_Null()
        {
            var updatedDatum = _sut.InvokeTransform(null);
            Assert.Equal(_sut, updatedDatum);
        }

        [Fact]
        public void InvokeTransform_Throws()
        {
            MetricDatum TransformFunction(MetricDatum datum)
            {
                throw new ArgumentException("sample transform exception");
            }

            var updatedDatum = _sut.InvokeTransform(TransformFunction);
            Assert.NotNull(updatedDatum);
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
            Assert.Equal("hello", updatedDatum.Metadata[Key]);
        }
    }
}