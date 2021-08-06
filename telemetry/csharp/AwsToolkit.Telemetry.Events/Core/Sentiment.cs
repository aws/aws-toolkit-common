namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    /// <summary>
    /// Constants used for properties of type Sentiment.
    /// </summary>
    public class Sentiment
    {
        public static readonly Sentiment Positive = new Sentiment("Positive");
        public static readonly Sentiment Negative = new Sentiment("Negative");

        public string Value { get; }

        public Sentiment(string value)
        {
            Value = value;
        }
    }
}