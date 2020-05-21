using System;
using System.CodeDom;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Reflection;
using ToolkitTelemetryGenerator.Models;
using ToolkitTelemetryGenerator.Utils;

namespace ToolkitTelemetryGenerator
{
    /// <summary>
    /// Generates code that allows programs like the Toolkit to instantiate and publish Telemetry Events
    /// </summary>
    public class DefinitionsBuilder
    {
        private const string MetadataEntryFullName = "Amazon.ToolkitTelemetry.Model.MetadataEntry";
        private const string MetricDatumFullName = "Amazon.ToolkitTelemetry.Model.MetricDatum";
        private readonly List<MetricType> _types = new List<MetricType>();
        private readonly List<Metric> _metrics = new List<Metric>();

        private readonly CodeMethodReferenceExpression _invariantCulture =
            new CodeMethodReferenceExpression(new CodeTypeReferenceExpression(typeof(CultureInfo)),
                nameof(CultureInfo.InvariantCulture));

        private string _namespace;

        private CodeCompileUnit _generatedCode;
        private CodeNamespace _blankNamespace; // Used for top level Using statements
        private CodeNamespace _generatedNamespace; // Where generated code goes

        private CodeTypeDeclaration _telemetryEventsClass;

        public DefinitionsBuilder AddMetricsTypes(IList<MetricType> types)
        {
            _types.AddRange(types);

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

            _generatedCode = new CodeCompileUnit();
            _blankNamespace = new CodeNamespace();
            _generatedNamespace = new CodeNamespace(_namespace);

            _generatedCode.Namespaces.Add(_blankNamespace);
            _generatedCode.Namespaces.Add(_generatedNamespace);

            // Add a top level comment
            _blankNamespace.Comments.Add(new CodeCommentStatement("--------------------------------------------------------------------------------", true));
            _blankNamespace.Comments.Add(new CodeCommentStatement("This file is generated from https://github.com/aws/aws-toolkit-common/tree/master/telemetry", true));
            _blankNamespace.Comments.Add(new CodeCommentStatement("--------------------------------------------------------------------------------", true));

            // Set up top level using statements
            _blankNamespace.Imports.Add(new CodeNamespaceImport("System"));
            _blankNamespace.Imports.Add(new CodeNamespaceImport("System.Collections.Generic"));

            // public sealed class ToolkitTelemetryEvent (contains generated code the toolkit uses to record metrics)
            _telemetryEventsClass = new CodeTypeDeclaration()
            {
                Name = "ToolkitTelemetryEvent",
                IsClass = true,
                TypeAttributes = TypeAttributes.Public
            };
            _telemetryEventsClass.Comments.Add(new CodeCommentStatement("Contains methods to record telemetry events", true));
            _generatedNamespace.Types.Add(_telemetryEventsClass);

            GenerateFixedCode();
            ProcessMetricTypes();
            ProcessMetrics();

            // Output generated code to a string
            CodeDomProvider provider = CodeDomProvider.CreateProvider("CSharp");
            CodeGeneratorOptions options = new CodeGeneratorOptions
            {
                BracingStyle = "C", 
                BlankLinesBetweenMembers = true
            };

            using (var writer = new StringWriter())
            {
                provider.GenerateCodeFromCompileUnit(_generatedCode, writer, options);
                return writer.ToString()
                    // XXX: CodeDom does not support static class generation. Post processing to accomplish this.
                    .Replace($"public class {_telemetryEventsClass.Name}", $"public static class {_telemetryEventsClass.Name}");
            }
        }

        /// <summary>
        /// Generate base classes and utility methods to support recording metrics
        /// </summary>
        private void GenerateFixedCode()
        {
            GenerateBaseMetricDataClass();
            GenerateTelemetryEventClass();
            GenerateTelemetryLoggerClass();
            GenerateMetricDatumExtensionMethods();
        }

        /// <summary>
        /// Generate the base class to all telemetry event classes that the Toolkit can instantiate
        /// </summary>
        private void GenerateBaseMetricDataClass()
        {
            var cls = new CodeTypeDeclaration
            {
                IsClass = true,
                Name = "BaseMetricData",
                TypeAttributes = TypeAttributes.Public | TypeAttributes.Abstract
            };

            cls.Members.Add(new CodeMemberField("DateTime?", "CreatedOn") {Attributes = MemberAttributes.Public});
            cls.Members.Add(new CodeMemberField("double?", "Value") { Attributes = MemberAttributes.Public });

            _generatedNamespace.Types.Add(cls);
        }

        /// <summary>
        /// Generates the TelemetryEvent class, which is the generalized shape of a telemetry event to be recorded by the Toolkit.
        /// </summary>
        private void GenerateTelemetryEventClass()
        {
            var telemetryEventClass = new CodeTypeDeclaration("TelemetryEvent")
            {
                IsClass = true,
                TypeAttributes = TypeAttributes.Public | TypeAttributes.Sealed
            };

            telemetryEventClass.Comments.Add(new CodeCommentStatement("Generalized Telemetry information to send to the backend", true));
            telemetryEventClass.Comments.Add(new CodeCommentStatement("<seealso cref=\"ITelemetryLogger\"/>", true));

            var createdOnField = new CodeMemberField(typeof(DateTime), "CreatedOn")
            {
                Attributes = MemberAttributes.Public
            };
            createdOnField.Comments.Add(
                new CodeCommentStatement("Timestamp is applied to all Data entries when sent to server", true));
            telemetryEventClass.Members.Add(createdOnField);

            // TODO : Bundle the code generator and the generated telemetry client into one NuGet package.
            // MetricDatum comes from autogenerated telemetry client (Amazon.ToolkitTelemetry.Model)
            var dataField = new CodeMemberField($"IList<{MetricDatumFullName}>", "Data")
            {
                Attributes = MemberAttributes.Public
            };
            telemetryEventClass.Members.Add(dataField);

            _generatedNamespace.Types.Add(telemetryEventClass);
        }

        /// <summary>
        /// Generates the ITelemetryLogger interface, which the Toolkit implements as the means of handling telemetry
        /// events to be sent to the backend. Auto-generated "RecordXxx" calls operate against this.
        /// </summary>
        private void GenerateTelemetryLoggerClass()
        {
            var telemetryLogger = new CodeTypeDeclaration("ITelemetryLogger")
            {
                IsInterface = true,
            };

            telemetryLogger.Comments.Add(new CodeCommentStatement("Implementations handle sending Telemetry Events to the backend.", true));

            var recordMethod = new CodeMemberMethod()
            {
                Name = "Record",
            };
            recordMethod.Comments.Add(new CodeCommentStatement("Send Telemetry information", true));
            recordMethod.Parameters.Add(new CodeParameterDeclarationExpression("TelemetryEvent", "telemetryEvent"));

            telemetryLogger.Members.Add(recordMethod);

            _generatedNamespace.Types.Add(telemetryLogger);
        }

        private void GenerateMetricDatumExtensionMethods()
        {
            GenerateMetricDatumExtensionMethod();
            GenerateMetricDatumExtensionMethod_Object();
            GenerateMetricDatumExtensionMethod_Bool();
            GenerateMetricDatumExtensionMethod_Double();
            GenerateMetricDatumExtensionMethod_Int();
        }

        private void GenerateMetricDatumExtensionMethod()
        {
            var addMetadata = new CodeMemberMethod()
            {
                Name = "AddMetadata",
                Attributes = MemberAttributes.Private | MemberAttributes.Static,
                ReturnType = new CodeTypeReference(typeof(void))
            };

            addMetadata.Comments.AddRange(CreateAddMetadataComments().ToArray());

            // Signature Args
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression($"this {MetricDatumFullName}", "metricDatum"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(string), "key"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(string), "value"));

            // Method Body
            var entryVar = new CodeVariableReferenceExpression("entry");
            
            var conditional = new CodeConditionStatement()
            {
                Condition = new CodeMethodInvokeExpression(new CodeTypeReferenceExpression(typeof(string)), nameof(string.IsNullOrWhiteSpace), new CodeArgumentReferenceExpression("value"))
            };
            conditional.TrueStatements.Add(new CodeMethodReturnStatement());
            addMetadata.Statements.Add(conditional);
            addMetadata.Statements.Add(new CodeSnippetStatement());

            addMetadata.Statements.Add(new CodeVariableDeclarationStatement("var", entryVar.VariableName, new CodeObjectCreateExpression(MetadataEntryFullName)));
            addMetadata.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(entryVar, "Key"), new CodeArgumentReferenceExpression("key")));
            addMetadata.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(entryVar, "Value"), new CodeArgumentReferenceExpression("value")));

            addMetadata.Statements.Add(new CodeSnippetStatement());
            addMetadata.Statements.Add(new CodeMethodInvokeExpression(new CodeFieldReferenceExpression(new CodeArgumentReferenceExpression("metricDatum"), "Metadata"), "Add", entryVar));

            _telemetryEventsClass.Members.Add(addMetadata);
        }

        private void GenerateMetricDatumExtensionMethod_Object()
        {
            var addMetadata = new CodeMemberMethod()
            {
                Name = "AddMetadata",
                Attributes = MemberAttributes.Private | MemberAttributes.Static,
                ReturnType = new CodeTypeReference(typeof(void))
            };

            addMetadata.Comments.AddRange(CreateAddMetadataComments("(object overload)").ToArray());

            // Signature Args
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression($"this {MetricDatumFullName}", "metricDatum"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(string), "key"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(object), "value"));

            // Method Body
            // "If value is null, return"
            var valueArg = new CodeArgumentReferenceExpression("value");

            var conditional = new CodeConditionStatement(
                new CodeBinaryOperatorExpression(valueArg, CodeBinaryOperatorType.ValueEquality,
                    new CodePrimitiveExpression()),
                new CodeMethodReturnStatement()
            );

            addMetadata.Statements.Add(conditional);
            addMetadata.Statements.Add(new CodeSnippetStatement());

            // "Call AddMetadata with value.ToString()"
            addMetadata.Statements.Add(
                new CodeMethodInvokeExpression(
                    new CodeArgumentReferenceExpression("metricDatum"),
                    "AddMetadata",
                    new CodeArgumentReferenceExpression("key"),
                    new CodeMethodInvokeExpression(valueArg, "ToString")
                ));

            _telemetryEventsClass.Members.Add(addMetadata);
        }

        private void GenerateMetricDatumExtensionMethod_Bool()
        {
            var addMetadata = new CodeMemberMethod()
            {
                Name = "AddMetadata",
                Attributes = MemberAttributes.Private | MemberAttributes.Static,
                ReturnType = new CodeTypeReference(typeof(void)),
            };

            addMetadata.Comments.AddRange(CreateAddMetadataComments("(bool overload)").ToArray());

            // Signature Args
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression($"this {MetricDatumFullName}", "metricDatum"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(string), "key"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(bool), "value"));

            // Method Body
            // "Call AddMetadata with 'true' or 'false'"
            var valueStrRef = new CodeVariableReferenceExpression("valueStr");
            addMetadata.Statements.Add(new CodeVariableDeclarationStatement(typeof(string), valueStrRef.VariableName, new CodePrimitiveExpression("false")));

            var conditional = new CodeConditionStatement(
                new CodeArgumentReferenceExpression("value"),
                new CodeAssignStatement(valueStrRef, new CodePrimitiveExpression("true"))
            );

            addMetadata.Statements.Add(conditional);
            addMetadata.Statements.Add(new CodeSnippetStatement());

            addMetadata.Statements.Add(
                new CodeMethodInvokeExpression(
                    new CodeArgumentReferenceExpression("metricDatum"),
                    "AddMetadata",
                    new CodeArgumentReferenceExpression("key"),
                    valueStrRef
                ));

            _telemetryEventsClass.Members.Add(addMetadata);
        }

        private void GenerateMetricDatumExtensionMethod_Double()
        {
            var addMetadata = new CodeMemberMethod()
            {
                Name = "AddMetadata",
                Attributes = MemberAttributes.Private | MemberAttributes.Static,
                ReturnType = new CodeTypeReference(typeof(void)),
            };

            addMetadata.Comments.AddRange(CreateAddMetadataComments("(double overload)").ToArray());

            // Signature Args
            addMetadata.Parameters.Add(
                new CodeParameterDeclarationExpression($"this {MetricDatumFullName}", "metricDatum"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(string), "key"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(double), "value"));

            // Method Body
            // "Call AddMetadata with value.ToString(CultureInfo.InvariantCulture)"
            addMetadata.Statements.Add(
                new CodeMethodInvokeExpression(
                    new CodeArgumentReferenceExpression("metricDatum"),
                    "AddMetadata",
                    new CodeArgumentReferenceExpression("key"),
                    new CodeMethodInvokeExpression(new CodeArgumentReferenceExpression("value"), nameof(int.ToString),
                        _invariantCulture)
                ));

            _telemetryEventsClass.Members.Add(addMetadata);
        }

        private void GenerateMetricDatumExtensionMethod_Int()
        {
            var addMetadata = new CodeMemberMethod()
            {
                Name = "AddMetadata",
                Attributes = MemberAttributes.Private | MemberAttributes.Static,
                ReturnType = new CodeTypeReference(typeof(void)),
            };

            addMetadata.Comments.AddRange(CreateAddMetadataComments("(int overload)").ToArray());

            // Signature Args
            addMetadata.Parameters.Add(
                new CodeParameterDeclarationExpression($"this {MetricDatumFullName}", "metricDatum"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(string), "key"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(int), "value"));

            // Method Body
            // "Call AddMetadata with value.ToString(CultureInfo.InvariantCulture)"
            addMetadata.Statements.Add(
                new CodeMethodInvokeExpression(
                    new CodeArgumentReferenceExpression("metricDatum"),
                    "AddMetadata",
                    new CodeArgumentReferenceExpression("key"),
                    new CodeMethodInvokeExpression(new CodeArgumentReferenceExpression("value"), nameof(int.ToString),
                        _invariantCulture)
                ));

            _telemetryEventsClass.Members.Add(addMetadata);
        }

        private IList<CodeCommentStatement> CreateAddMetadataComments(string overloadDecorator = null)
        {
            var statements = new List<CodeCommentStatement>
            {
                new CodeCommentStatement(
                    $"Utility method for generated code to add a metadata to a datum {overloadDecorator ?? string.Empty}",
                    true),
                new CodeCommentStatement("Metadata is only added if the value is non-blank", true)
            };

            return statements;
        }

        private void ProcessMetricTypes()
        {
            _types.ForEach(ProcessMetricType);
        }

        internal void ProcessMetricType(MetricType type)
        {
            // Handle non-POCO types
            if (!type.IsAliasedType())
            {
                GenerateEnumStruct(type);
            }
        }

        private void GenerateEnumStruct(MetricType type)
        {
            var typeDeclaration = new CodeTypeDeclaration(type.GetGeneratedTypeName())
            {
                IsStruct = true,
                TypeAttributes = TypeAttributes.Public | TypeAttributes.Sealed
            };

            if (!string.IsNullOrWhiteSpace(type.description))
            {
                typeDeclaration.Comments.Add(new CodeCommentStatement(type.description, true));
            }

            var valueField = new CodeMemberField(typeof(string), "_value");
            valueField.Attributes = MemberAttributes.Private;
            typeDeclaration.Members.Add(valueField);

            // Generate the constructor
            var typeConstructor = new CodeConstructor();
            typeConstructor.Attributes = MemberAttributes.Public;
            typeConstructor.Parameters.Add(new CodeParameterDeclarationExpression("System.string", "value"));

            // this._value = value;
            var valueFieldRef = new CodeFieldReferenceExpression(new CodeThisReferenceExpression(), valueField.Name);
            typeConstructor.Statements.Add(new CodeAssignStatement(valueFieldRef, new CodeArgumentReferenceExpression("value")));

            typeDeclaration.Members.Add(typeConstructor);

            // Generate static fields for each allowed value
            type.allowedValues.Select(allowedValue =>
            {
                // eg: public static readonly Runtime Dotnetcore21 = new Runtime("dotnetcore2.1")
                CodeMemberField field = new CodeMemberField($"readonly {type.GetGeneratedTypeName()}",
                    allowedValue.ToCamelCase().Replace(".", ""));
                field.InitExpression = new CodePrimitiveExpression(allowedValue);
                field.InitExpression = new CodeObjectCreateExpression(type.GetGeneratedTypeName(),
                    new CodeExpression[] {new CodePrimitiveExpression(allowedValue)});
                field.Attributes = MemberAttributes.Static | MemberAttributes.Public;
                field.Comments.Add(new CodeCommentStatement(allowedValue, true));

                return field;
            }).ToList().ForEach(enumField => typeDeclaration.Members.Add(enumField));

            // Generate a ToString method
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

            _generatedNamespace.Types.Add(typeDeclaration);
        }

        private void ProcessMetrics()
        {
            _metrics.ForEach(ProcessMetric);
        }

        private void ProcessMetric(Metric metric)
        {
            CreateMetricDataClass(metric);
            CreateRecordMetricMethodByDataClass(metric);
        }

        private void CreateMetricDataClass(Metric metric)
        {
            var cls = new CodeTypeDeclaration
            {
                IsClass = true,
                Name = SanitizeName(metric.name),
                TypeAttributes = TypeAttributes.Public | TypeAttributes.Sealed
            };

            cls.BaseTypes.Add("BaseMetricData");

            if (!string.IsNullOrWhiteSpace(metric.description))
            {
                cls.Comments.Add(new CodeCommentStatement(metric.description, true));
            }

            // Generate the class members
            metric.metadata?
                .ToList().ForEach(metadata =>
                {
                    var metricType = GetMetricType(metadata.type);
                    var fieldName = metadata.type.ToCamelCase();

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

            _generatedNamespace.Types.Add(cls);
        }

        // Eg: 'count' -> "Unit.Count"
        private CodeExpression GetMetricUnitExpression(Metric metric)
        {
            var unit = metric.unit ?? "None"; // Fall back to "Unit.None" if there is no metric unit provided
            return new CodeFieldReferenceExpression(new CodeTypeReferenceExpression("Amazon.ToolkitTelemetry.Unit"), unit.ToCamelCase());
        }

        private void CreateRecordMetricMethodByDataClass(Metric metric)
        {
            // var metadataParameters = CreateMetadataParameters(metric).ToList();

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

            // Create a TelemetryEvent from the given payload
            // Generate the method body
            var telemetryEventVar = new CodeVariableReferenceExpression("telemetryEvent");
            var telemetryEventDataField = new CodeFieldReferenceExpression(telemetryEventVar, "Data");
            var argReference = new CodeArgumentReferenceExpression("payload");
            var datumVar = new CodeVariableReferenceExpression("datum");
            var datumAddData = new CodeMethodReferenceExpression(datumVar, "AddMetadata");
            var datetimeNow = new CodeMethodReferenceExpression(new CodeTypeReferenceExpression(typeof(DateTime)), nameof(DateTime.Now));

            // Instantiate TelemetryEvent
            recordMethod.Statements.Add(new CodeVariableDeclarationStatement("var", telemetryEventVar.VariableName, new CodeObjectCreateExpression("TelemetryEvent")));

            // Set telemetryEvent.CreatedOn to (payload.CreatedOn ?? DateTime.Now)
            var payloadCreatedOn = new CodeFieldReferenceExpression(argReference, "CreatedOn");
            var telemetryEventCreatedOn = new CodeFieldReferenceExpression(telemetryEventVar, "CreatedOn");

            var createdOnCond = new CodeConditionStatement();
            createdOnCond.Condition = new CodeFieldReferenceExpression(payloadCreatedOn, "HasValue");
            createdOnCond.TrueStatements.Add(new CodeAssignStatement(telemetryEventCreatedOn, new CodeFieldReferenceExpression(payloadCreatedOn, "Value")));
            createdOnCond.FalseStatements.Add(new CodeAssignStatement(telemetryEventCreatedOn, datetimeNow));
            recordMethod.Statements.Add(createdOnCond);

            // recordMethod.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(telemetryEventVar, "CreatedOn"), datetimeNow));
            recordMethod.Statements.Add(new CodeAssignStatement(telemetryEventDataField, new CodeObjectCreateExpression($"List<{MetricDatumFullName}>")));
            
            // Instantiate MetricDatum
            recordMethod.Statements.Add(new CodeSnippetStatement());
            recordMethod.Statements.Add(new CodeVariableDeclarationStatement("var", datumVar.VariableName, new CodeObjectCreateExpression(MetricDatumFullName)));
            recordMethod.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(datumVar, "MetricName"), new CodePrimitiveExpression(metric.name)));
            recordMethod.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(datumVar, "Unit"), GetMetricUnitExpression(metric)));

            // Set Datum.Value to (payload.Value ?? 1)
            var payloadValue = new CodeFieldReferenceExpression(argReference, "Value");
            var datumValue = new CodeFieldReferenceExpression(datumVar, "Value");

            var valueCond = new CodeConditionStatement();
            valueCond.Condition = new CodeFieldReferenceExpression(payloadValue, "HasValue");
            valueCond.TrueStatements.Add(new CodeAssignStatement(datumValue, new CodeFieldReferenceExpression(payloadValue, "Value")));
            valueCond.FalseStatements.Add(new CodeAssignStatement(datumValue, new CodePrimitiveExpression(1)));
            recordMethod.Statements.Add(valueCond);

            // Set MetricDatum Metadata values
            metric.metadata?.ToList().ForEach(metadata =>
            {
                recordMethod.Statements.Add(new CodeSnippetStatement());

                // var parameter = metadataParameters.Single(p => p.Name == metadata.type);
                var payloadField = new CodeFieldReferenceExpression(argReference, SanitizeName(metadata.type));

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

                    recordMethod.Statements.Add(
                        new CodeConditionStatement(hasValue, new CodeExpressionStatement(addMetadata)));
                }
                else
                {
                    // Generate: datum.AddMetadata("foo", payload.foo);
                    recordMethod.Statements.Add(new CodeMethodInvokeExpression(datumAddData,
                        new CodePrimitiveExpression(metadata.type), payloadField));
                }
            });

            // Generate: telemetryEvent.Data.Add(datum);
            recordMethod.Statements.Add(new CodeSnippetStatement());
            recordMethod.Statements.Add(new CodeMethodInvokeExpression(telemetryEventDataField, "Add", datumVar));

            _telemetryEventsClass.Members.Add(recordMethod);
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
                    .Select(x => x.ToCamelCase())
            );
        }
    }
}