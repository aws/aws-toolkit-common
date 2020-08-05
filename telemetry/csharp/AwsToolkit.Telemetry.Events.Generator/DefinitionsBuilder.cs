using System;
using System.CodeDom;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using Amazon.AwsToolkit.Telemetry.Events.Generator.Models;
using Amazon.AwsToolkit.Telemetry.Events.Generator.Utils;

namespace Amazon.AwsToolkit.Telemetry.Events.Generator
{
    /// <summary>
    /// Generates code that allows programs like the Toolkit to instantiate and publish Telemetry Events
    /// </summary>
    public class DefinitionsBuilder
    {
        private const string MetadataEntryFullName = "MetadataEntry";
        private const string MetricDatumFullName = "MetricDatum";
        private const string AddMetadataMethodName = "AddMetadata";

        private readonly CodeMethodReferenceExpression _invariantCulture =
            new CodeMethodReferenceExpression(new CodeTypeReferenceExpression(typeof(CultureInfo)),
                nameof(CultureInfo.InvariantCulture));

        private readonly CodeMethodReferenceExpression _debugAssert = 
            new CodeMethodReferenceExpression(new CodeTypeReferenceExpression(typeof(System.Diagnostics.Debug)), "Assert");

        private string _namespace;

        // Used for lookup during generation
        private readonly List<MetricType> _types = new List<MetricType>();

        // Types to produce generated code for
        private readonly List<MetricType> _typesToGenerate = new List<MetricType>();
        private readonly List<Metric> _metrics = new List<Metric>();

        /// <summary>
        /// Supply Metrics Type definitions to the builder
        /// </summary>
        /// <param name="types"></param>
        /// <param name="referenceOnly">
        /// When true, the types will only be used to assist in generating code for metrics.
        ///     The code that is generated is expected to reside somewhere that can reference these types.
        ///     This would be used by repo-specific telemetry definitions.
        /// When false, the types will have code produced to define them.
        ///     This would be used by the toolkit common telemetry definitions, and baked into a package.
        /// </param>
        public DefinitionsBuilder AddMetricsTypes(IList<MetricType> types, bool referenceOnly = false)
        {
            _types.AddRange(types);

            if (!referenceOnly)
            {
                _typesToGenerate.AddRange(types);
            }

            return this;
        }

        public DefinitionsBuilder AddMetrics(IList<Metric> metrics)
        {
            _metrics.AddRange(metrics);

            return this;
        }

        public DefinitionsBuilder WithNamespace(string generatedNamespace)
        {
            _namespace = generatedNamespace;

            return this;
        }

        public string Build()
        {
            if (string.IsNullOrWhiteSpace(_namespace))
            {
                throw new MissingFieldException("Namespace not provided");
            }

            var blankNamespace = new CodeNamespace(); // Used for top level Using statements
            var generatedNamespace = new CodeNamespace(_namespace); // Where generated classes, types, etc are added to

            var generatedCode = new CodeCompileUnit();
            generatedCode.Namespaces.Add(blankNamespace);
            generatedCode.Namespaces.Add(generatedNamespace);

            // Add a top level comment
            blankNamespace.Comments.Add(new CodeCommentStatement("--------------------------------------------------------------------------------", true));
            blankNamespace.Comments.Add(new CodeCommentStatement("This file is generated from https://github.com/aws/aws-toolkit-common/tree/master/telemetry", true));
            blankNamespace.Comments.Add(new CodeCommentStatement("--------------------------------------------------------------------------------", true));

            // Set up top level using statements
            blankNamespace.Imports.Add(new CodeNamespaceImport("System"));
            blankNamespace.Imports.Add(new CodeNamespaceImport("System.Collections.Generic"));
            // All generated code is expected to be placed in, or somewhere with a dependency on,
            // AwsToolkit.Telemetry.Events
            if (_namespace != Options.DefaultEventsNamespace)
            {
                blankNamespace.Imports.Add(new CodeNamespaceImport(Options.DefaultEventsNamespace));
            }
            blankNamespace.Imports.Add(new CodeNamespaceImport("Amazon.AwsToolkit.Telemetry.Events.Core"));

            // "public sealed partial class ToolkitTelemetryEvent" (contains generated code the toolkit uses to record metrics)
            var telemetryEventsClass = new CodeTypeDeclaration()
            {
                Name = "ToolkitTelemetryEvent",
                IsClass = true,
                IsPartial = true,
                TypeAttributes = TypeAttributes.Public
            };
            telemetryEventsClass.Comments.Add(new CodeCommentStatement("Contains methods to record telemetry events", true));
            generatedNamespace.Types.Add(telemetryEventsClass);

            ProcessMetricTypes(generatedNamespace);
            ProcessMetrics(telemetryEventsClass, generatedNamespace);

            // Output generated code to a string
            CodeDomProvider provider = CodeDomProvider.CreateProvider("CSharp");
            CodeGeneratorOptions options = new CodeGeneratorOptions
            {
                BracingStyle = "C", 
                BlankLinesBetweenMembers = true
            };

            using (var writer = new StringWriter())
            {
                provider.GenerateCodeFromCompileUnit(generatedCode, writer, options);
                return writer.ToString()
                    // XXX: CodeDom does not support static class generation. Post processing to accomplish this.
                    .Replace($"public partial class {telemetryEventsClass.Name}", $"public static partial class {telemetryEventsClass.Name}");
            }
        }

        /// <summary>
        /// Generate code to support defined metric types
        /// </summary>
        /// <param name="generatedNamespace"></param>
        private void ProcessMetricTypes(CodeNamespace generatedNamespace)
        {
            _typesToGenerate.ForEach(metricType => ProcessMetricType(metricType, generatedNamespace));
        }

        /// <summary>
        /// Generate code to support a metric type
        /// </summary>
        internal void ProcessMetricType(MetricType type, CodeNamespace generatedNamespace)
        {
            // Handle non-POCO types
            if (!type.IsAliasedType())
            {
                // Generate strongly typed code for types that contain "allowed values"
                generatedNamespace.Types.Add(GenerateEnumStruct(type));
            }
        }

        /// <summary>
        /// Given a type that contains a set of allowed values, generates a struct containing static fields.
        /// </summary>
        private CodeTypeDeclaration GenerateEnumStruct(MetricType type)
        {
            var typeDeclaration = new CodeTypeDeclaration(type.GetGeneratedTypeName())
            {
                IsStruct = true,
                TypeAttributes = TypeAttributes.Public | TypeAttributes.Sealed
            };

            typeDeclaration.Comments.Add(new CodeCommentStatement("Metric field type", true));
            if (!string.IsNullOrWhiteSpace(type.description))
            {
                typeDeclaration.Comments.Add(new CodeCommentStatement(type.description, true));
            }

            var valueField = new CodeMemberField(typeof(string), "_value");
            valueField.Attributes = MemberAttributes.Private;
            typeDeclaration.Members.Add(valueField);

            // Generate the constructor (stores provided value in _value)
            var typeConstructor = new CodeConstructor();
            typeConstructor.Attributes = MemberAttributes.Public;
            typeConstructor.Parameters.Add(new CodeParameterDeclarationExpression("System.string", "value"));

            // this._value = value;
            var valueFieldRef = new CodeFieldReferenceExpression(new CodeThisReferenceExpression(), valueField.Name);
            typeConstructor.Statements.Add(new CodeAssignStatement(valueFieldRef, new CodeArgumentReferenceExpression("value")));

            typeDeclaration.Members.Add(typeConstructor);

            // Generate static fields for each allowed value
            type.allowedValues?
                .ToList()
                .ForEach(allowedValue =>
            {
                // eg: public static readonly Runtime Dotnetcore21 = new Runtime("dotnetcore2.1")
                CodeMemberField field = new CodeMemberField($"readonly {type.GetGeneratedTypeName()}",
                    allowedValue.ToPascalCase().Replace(".", ""))
                {
                    InitExpression = new CodeObjectCreateExpression(type.GetGeneratedTypeName(),
                        new CodeExpression[] {new CodePrimitiveExpression(allowedValue)}),
                    Attributes = MemberAttributes.Static | MemberAttributes.Public
                };
                field.Comments.Add(new CodeCommentStatement(allowedValue, true));

                typeDeclaration.Members.Add(field);
            });

            // Generate a ToString method, which returns this._value
            // ToString is used by the AddMetadata method
            var toString = new CodeMemberMethod()
            {
                Name = "ToString",
                Attributes = MemberAttributes.Public | MemberAttributes.Override,
                ReturnType = new CodeTypeReference(typeof(string))
            };
            
            toString.Statements.Add(
                new CodeMethodReturnStatement(new CodeFieldReferenceExpression(new CodeThisReferenceExpression(),
                    valueField.Name)));

            typeDeclaration.Members.Add(toString);

            return typeDeclaration;
        }

        /// <summary>
        /// Generate code to support defined metrics
        /// </summary>
        /// <param name="telemetryEventsClass"></param>
        private void ProcessMetrics(CodeTypeDeclaration telemetryEventsClass, CodeNamespace generatedNamespace)
        {
            _metrics.ForEach(metric => ProcessMetric(metric, telemetryEventsClass, generatedNamespace));
        }

        /// <summary>
        /// Generate code to support a metric
        /// </summary>
        private void ProcessMetric(Metric metric, CodeTypeDeclaration telemetryEventsClass, CodeNamespace generatedNamespace)
        {
            generatedNamespace.Types.Add(CreateMetricDataClass(metric));
            telemetryEventsClass.Members.Add(CreateRecordMetricMethodByDataClass(metric));
        }

        /// <summary>
        /// Generates the data class used by the toolkit to represent this metric
        /// </summary>
        private CodeTypeDeclaration CreateMetricDataClass(Metric metric)
        {
            var cls = new CodeTypeDeclaration
            {
                IsClass = true,
                Name = SanitizeName(metric.name),
                TypeAttributes = TypeAttributes.Public | TypeAttributes.Sealed
            };

            cls.BaseTypes.Add("BaseTelemetryEvent");

            if (!string.IsNullOrWhiteSpace(metric.description))
            {
                cls.Comments.Add(new CodeCommentStatement(metric.description, true));
            }

            // Generate the class members
            metric.metadata?
                .ToList().ForEach(metadata =>
                {
                    var metricType = GetMetricType(metadata.type);
                    var fieldName = metadata.type.ToPascalCase();

                    var generatedTypeName = metricType.GetGeneratedTypeName();

                    if (IsNullable(metadata))
                    {
                        generatedTypeName += "?";
                    }

                    var field = new CodeMemberField(generatedTypeName, fieldName)
                    {
                        Attributes = MemberAttributes.Public
                    };

                    var description = $"{(metadata.ResolvedRequired ? "" : "Optional - ")}{metricType.description ?? string.Empty}";
                    if (!string.IsNullOrEmpty(description))
                    {
                        field.Comments.Add(new CodeCommentStatement(description, true));
                    }

                    cls.Members.Add(field);
                });

            return cls;
        }

        // Eg: 'count' -> "Unit.Count"
        private CodeExpression GetMetricUnitExpression(Metric metric)
        {
            var unit = metric.unit ?? "None"; // Fall back to "Unit.None" if there is no metric unit provided
            return new CodeFieldReferenceExpression(new CodeTypeReferenceExpression("Unit"), unit.ToPascalCase());
        }

        /// <summary>
        /// Generates the "Record Metric" method used by the toolkit to send this metric to the backend
        /// </summary>
        private CodeMemberMethod CreateRecordMetricMethodByDataClass(Metric metric)
        {
            CodeMemberMethod recordMethod = new CodeMemberMethod
            {
                Attributes = MemberAttributes.Public | MemberAttributes.Static,
                Name = $"Record{SanitizeName(metric.name)}",
                ReturnType = new CodeTypeReference()
            };

            if (!string.IsNullOrWhiteSpace(metric.description))
            {
                recordMethod.Comments.Add(new CodeCommentStatement("Records Telemetry Event:", true));
                recordMethod.Comments.Add(new CodeCommentStatement(metric.description, true));
            }

            // RecordXxx Parameters
            var telemetryLogger = new CodeParameterDeclarationExpression("this ITelemetryLogger", "telemetryLogger");
            recordMethod.Parameters.Add(telemetryLogger);
            recordMethod.Parameters.Add(new CodeParameterDeclarationExpression(SanitizeName(metric.name), "payload"));

            // Generate method body
            var tryStatements = new List<CodeStatement>();
            var catchClauses = new List<CodeCatchClause>();

            // Create a metrics object from the given payload
            // Generate the method body
            var metrics = new CodeVariableReferenceExpression("metrics");
            var metricsDataField = new CodeFieldReferenceExpression(metrics, "Data");
            var payload = new CodeArgumentReferenceExpression("payload");
            var datum = new CodeVariableReferenceExpression("datum");
            var datumAddData = new CodeMethodReferenceExpression(datum, AddMetadataMethodName);
            var datetimeNow = new CodeMethodReferenceExpression(new CodeTypeReferenceExpression(typeof(DateTime)), nameof(DateTime.Now));

            // Instantiate metrics
            tryStatements.Add(new CodeVariableDeclarationStatement("var", metrics.VariableName, new CodeObjectCreateExpression("Metrics")));

            // Set metrics.CreatedOn to (payload.CreatedOn ?? DateTime.Now)
            var payloadCreatedOn = new CodeFieldReferenceExpression(payload, "CreatedOn");
            var metricsCreatedOn = new CodeFieldReferenceExpression(metrics, "CreatedOn");

            var createdOnCond = new CodeConditionStatement();
            createdOnCond.Condition = new CodeFieldReferenceExpression(payloadCreatedOn, "HasValue");
            createdOnCond.TrueStatements.Add(new CodeAssignStatement(metricsCreatedOn, new CodeFieldReferenceExpression(payloadCreatedOn, "Value")));
            createdOnCond.FalseStatements.Add(new CodeAssignStatement(metricsCreatedOn, datetimeNow));
            tryStatements.Add(createdOnCond);

            // Instantiate a Data list
            tryStatements.Add(new CodeAssignStatement(metricsDataField, new CodeObjectCreateExpression($"List<{MetricDatumFullName}>")));
            
            // Instantiate MetricDatum
            tryStatements.Add(new CodeSnippetStatement());
            tryStatements.Add(new CodeVariableDeclarationStatement("var", datum.VariableName, new CodeObjectCreateExpression(MetricDatumFullName)));
            tryStatements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(datum, "MetricName"), new CodePrimitiveExpression(metric.name)));
            tryStatements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(datum, "Unit"), GetMetricUnitExpression(metric)));

            // Set Datum.Value to (payload.Value ?? 1)
            var payloadValue = new CodeFieldReferenceExpression(payload, "Value");
            var datumValue = new CodeFieldReferenceExpression(datum, "Value");

            var valueCond = new CodeConditionStatement();
            valueCond.Condition = new CodeFieldReferenceExpression(payloadValue, "HasValue");
            valueCond.TrueStatements.Add(new CodeAssignStatement(datumValue, new CodeFieldReferenceExpression(payloadValue, "Value")));
            valueCond.FalseStatements.Add(new CodeAssignStatement(datumValue, new CodePrimitiveExpression(1)));
            tryStatements.Add(valueCond);

            // Set MetricDatum Metadata values
            metric.metadata?.ToList().ForEach(metadata =>
            {
                tryStatements.Add(new CodeSnippetStatement());

                var payloadField = new CodeFieldReferenceExpression(payload, SanitizeName(metadata.type));

                if (IsNullable(metadata))
                {
                    // Generate: 
                    // if (payload.foo.HasValue)
                    // {
                    //     datum.AddMetadata("foo", payload.foo.Value);
                    // }
                    var hasValue = new CodeFieldReferenceExpression(payloadField, "HasValue");
                    var addMetadata = new CodeMethodInvokeExpression(datumAddData,
                        new CodePrimitiveExpression(metadata.type), new CodeFieldReferenceExpression(payloadField, "Value"));

                    tryStatements.Add(
                        new CodeConditionStatement(hasValue, new CodeExpressionStatement(addMetadata)));
                }
                else
                {
                    // Generate: datum.AddMetadata("foo", payload.foo);
                    tryStatements.Add(new CodeExpressionStatement (new CodeMethodInvokeExpression(datumAddData,
                        new CodePrimitiveExpression(metadata.type), payloadField)));
                }
            });

            // Generate: metrics.Data.Add(datum);
            tryStatements.Add(new CodeSnippetStatement());
            tryStatements.Add(new CodeExpressionStatement (new CodeMethodInvokeExpression(metricsDataField, "Add", datum)));

            // Generate: telemetryLogger.Record(metrics);
            tryStatements.Add(new CodeExpressionStatement (new CodeMethodInvokeExpression(new CodeArgumentReferenceExpression("telemetryLogger"), "Record", metrics)));

            var catchClause = new CodeCatchClause("e", new CodeTypeReference(typeof(Exception)));
            catchClause.Statements.Add(new CodeExpressionStatement(
                new CodeMethodInvokeExpression(
                    new CodeFieldReferenceExpression(new CodeArgumentReferenceExpression("telemetryLogger"), "Logger"), 
                    "Error", 
                    new CodePrimitiveExpression("Error recording telemetry event"),
                    new CodeArgumentReferenceExpression("e"))
            ));

            // System.Diagnostics.Debug.Assert(false, "Error Recording Telemetry");
            catchClause.Statements.Add(new CodeExpressionStatement(
                new CodeMethodInvokeExpression(
                    _debugAssert,
                    new CodePrimitiveExpression(false),
                    new CodePrimitiveExpression("Error Recording Telemetry"))
            ));

            catchClauses.Add(catchClause);

            recordMethod.Statements.Add(
                new CodeTryCatchFinallyStatement(tryStatements.ToArray(), catchClauses.ToArray())
            );

            return recordMethod;
        }

        private bool IsNullable(Metadata metadata)
        {
            var metricType = GetMetricType(metadata.type);

            if (!metricType.IsAliasedType())
            {
                return !metadata.ResolvedRequired;
            }

            var type = metricType.GetAliasedType();

            // System.string cannot be made nullable
            return type != typeof(string) && !metadata.ResolvedRequired;
        }

        private MetricType GetMetricType(string name)
        {
            return _types.Single(t => t.name == name);
        }

        private string SanitizeName(string name)
        {
            return string.Join(
                "",
                name
                    .Split(new char[] {'.', ',', '_', '-'}, StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.ToPascalCase())
            );
        }
    }
}