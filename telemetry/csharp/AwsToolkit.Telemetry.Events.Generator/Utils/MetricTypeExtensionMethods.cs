﻿using System;
using System.Collections.Generic;
using Amazon.AwsToolkit.Telemetry.Events.Generator.Models;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator.Utils
{
    public static class MetricTypeExtensionMethods
    {
        static readonly Dictionary<string, System.Type> AliasedTypes = new Dictionary<string, System.Type>()
        {
            // See https://github.com/aws/aws-toolkit-common/blob/main/telemetry/telemetrySchema.json
            // properties/types/items/properties/type
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

        public static Type GetAliasedType(this MetricType type)
        {
            if (!type.IsAliasedType())
            {
                throw new Exception($"type not aliased: {type.type}");
            }

            return AliasedTypes[type.type];
        }

        public static string GetGeneratedTypeName(this MetricType type)
        {
            var typeName = type.name;
            if (type.IsAliasedType())
            {
                typeName = type.GetAliasedType().FullName;
            }

            return typeName.ToPascalCase();
        }
    }
}