using System.Collections.Generic;
using ToolkitTelemetryGenerator.Models;

namespace ToolkitTelemetryGenerator.Utils
{
    public static class MetricTypeExtensionMethods
    {
        static readonly Dictionary<string, System.Type> AliasedTypes = new Dictionary<string, System.Type>()
        {
            {"int", typeof(int) },
            {"double", typeof(double) },
            {"string", typeof(string) },
            {"boolean", typeof(bool) },
        };

        public static bool IsAliasedType(this MetricType type)
        {
            if (type.allowedValues?.Length > 0)
            {
                return false;
            }

            return AliasedTypes.ContainsKey(type.type);
        }

        public static string GetAliasedTypeName(this MetricType type)
        {
            if (!type.IsAliasedType())
            {
                throw new System.Exception($"type not aliased: {type.type}");
            }

            return AliasedTypes[type.type].FullName;
        }

        public static string GetGeneratedTypeName(this MetricType type)
        {
            return $"{type.name[0].ToString().ToUpper()}{type.name.Substring(1)}";
        }
    }
}