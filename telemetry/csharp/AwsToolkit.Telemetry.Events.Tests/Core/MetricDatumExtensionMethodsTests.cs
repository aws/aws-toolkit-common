using Amazon.AwsToolkit.Telemetry.Events.Core;
using FluentAssertions;
using System;
using System.Globalization;
using System.Threading;
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

        public static TheoryData<object, string> CreateNumericEntries()
        {
            return new TheoryData<object, string>
            {
                { (int) 123_456, "123456" },
                { (uint) 123_456, "123456" },
                { (Int16) 12_345, "12345" },
                { (Int32) 123_456, "123456" },
                { (Int64) 123_456, "123456" },
                { (UInt16) 12_345 , "12345" },
                { (UInt32) 123_456, "123456" },
                { (UInt64) 123_456, "123456" },
                { (short) 12_345, "12345" },
                { (ushort) 12_345, "12345" },
                { (long) 123_456, "123456" },
                { (ulong) 123_456, "123456" },
                { (float) 1_234.56, "1234.56" },
                { (float) 1.234_5, "1.2345" },
                { (decimal) 123_456.789_012, "123456.789012" },
            };
        }

        [Theory]
        [MemberData(nameof(CreateNumericEntries))]
        public void AddMetadata_DetectPrimitiveType_NumericEntries(object numericValue, string expectedValue)
        {
            _sut.AddMetadata(Key, numericValue, detectPrimitiveType: true);
            _sut.Metadata[Key].Should().Be(expectedValue);
        }

        [Theory]
        [MemberData(nameof(CreateNumericEntries))]
        public void AddMetadata_DetectPrimitiveType_NumericEntries_Us(object numericValue, string expectedValue)
        {
            // Use a locale known to have decimal separators
            Thread.CurrentThread.CurrentCulture = new CultureInfo("en-US");

            _sut.AddMetadata(Key, numericValue, detectPrimitiveType: true);
            _sut.Metadata[Key].Should().Be(expectedValue);
        }

        [Theory]
        [MemberData(nameof(CreateNumericEntries))]
        public void AddMetadata_DetectPrimitiveType_NumericEntries_CommaSeparatorLocale(object numericValue, string expectedValue)
        {
            // Set the local to use comma separators
            var commaLocale = new CultureInfo("en-US");
            commaLocale.NumberFormat.NumberDecimalSeparator = ",";

            Thread.CurrentThread.CurrentCulture = commaLocale;

            _sut.AddMetadata(Key, numericValue, detectPrimitiveType: true);
            _sut.Metadata[Key].Should().Be(expectedValue);
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