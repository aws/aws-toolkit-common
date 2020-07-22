namespace Amazon.AwsToolkit.Telemetry.Events.Core
{
    /// <summary>
    /// Constants used for properties of type Unit.
    /// </summary>
    public class Unit
    {
        public static readonly Unit Bytes = new Unit("Bytes");
        public static readonly Unit Count = new Unit("Count");
        public static readonly Unit Milliseconds = new Unit("Milliseconds");
        public static readonly Unit None = new Unit("None");
        public static readonly Unit Percent = new Unit("Percent");

        public string Value { get; }

        public Unit(string value)
        {
            Value = value;
        }
    }
}