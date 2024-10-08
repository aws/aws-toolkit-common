﻿// ReSharper disable InconsistentNaming
namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Core.Models
{
    public class Metadata
    {
        public string type { get; set; }
        public bool? required { get; set; }

        public bool ResolvedRequired
        {
            get
            {
                if (!required.HasValue)
                {
                    return true;
                }

                return required.Value;
            }
        }
    }
}