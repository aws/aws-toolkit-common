using System;
using System.CodeDom;
using System.CodeDom.Compiler;
using System.Collections.Generic;
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

            // TODO : File heading comment - where generated from
            _generatedCode = new CodeCompileUnit();
            _blankNamespace = new CodeNamespace();
            _generatedNamespace = new CodeNamespace(_namespace);

            _generatedCode.Namespaces.Add(_blankNamespace);
            _generatedCode.Namespaces.Add(_generatedNamespace);

            // Set up top level using statements
            _blankNamespace.Imports.Add(new CodeNamespaceImport("System"));
            _blankNamespace.Imports.Add(new CodeNamespaceImport("System.Collections.Generic"));

            // public sealed class ToolkitTelemetryEvent (contains generated code)
            _telemetryEventsClass = new CodeTypeDeclaration("ToolkitTelemetryEvent");
            _telemetryEventsClass.IsClass = true;
            _telemetryEventsClass.TypeAttributes = TypeAttributes.Public;
            _generatedNamespace.Types.Add(_telemetryEventsClass);

            GenerateFixedCode();
            ProcessMetricTypes();
            ProcessMetrics();

            CodeDomProvider provider = CodeDomProvider.CreateProvider("CSharp");
            CodeGeneratorOptions options = new CodeGeneratorOptions();
            options.BracingStyle = "C";
            using (var writer = new StringWriter())
            {
                provider.GenerateCodeFromCompileUnit(_generatedCode, writer, options);
                return writer.ToString()
                    // XXX: CodeDom does not support static class generation. Post processing to accomplish this.
                    .Replace($"public class {_telemetryEventsClass.Name}", $"public static class {_telemetryEventsClass.Name}");
            }
        }

        private void GenerateFixedCode()
        {
            GenerateBaseMetricDataClass();
            GenerateTelemetryEventClass();
            GenerateTelemetryLoggerClass();
            GenerateMetricDatumExtensionMethod();
        }

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

        private void GenerateTelemetryEventClass()
        {
            var telemetryEventClass = new CodeTypeDeclaration("TelemetryEvent")
            {
                IsClass = true,
                TypeAttributes = TypeAttributes.Public | TypeAttributes.Sealed
            };

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

        private void GenerateTelemetryLoggerClass()
        {
            var telemetryLogger = new CodeTypeDeclaration("ITelemetryLogger")
            {
                IsInterface = true,
            };

            var recordMethod = new CodeMemberMethod()
            {
                Name = "Record",
            };
            recordMethod.Comments.Add(new CodeCommentStatement("Send Telemetry information", true));
            recordMethod.Parameters.Add(new CodeParameterDeclarationExpression("TelemetryEvent", "telemetryEvent"));

            telemetryLogger.Members.Add(recordMethod);

            _generatedNamespace.Types.Add(telemetryLogger);
        }

        private void GenerateMetricDatumExtensionMethod()
        {
            var addMetadata = new CodeMemberMethod()
            {
                Name = "AddMetadata",
                Attributes = MemberAttributes.Private | MemberAttributes.Static,
                ReturnType = new CodeTypeReference(typeof(void))
            };

            addMetadata.Comments.Add(new CodeCommentStatement("Utility method for generated code to add a metadata to a datum", true));
            addMetadata.Comments.Add(new CodeCommentStatement("Metadata is only added if the value is non-blank", true));

            // Signature Args
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression($"this {MetricDatumFullName}", "metricDatum"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(string), "key"));
            addMetadata.Parameters.Add(new CodeParameterDeclarationExpression(typeof(string), "value"));

            // Method Body
            var entryVar = new CodeVariableReferenceExpression("entry");
            
            var conditional = new CodeConditionStatement()
            {
                Condition = new CodeMethodInvokeExpression(new CodeTypeReferenceExpression(typeof(string)), "IsNullOrWhiteSpace", new CodeArgumentReferenceExpression("value"))
            };
            conditional.TrueStatements.Add(new CodeMethodReturnStatement());
            addMetadata.Statements.Add(conditional);

            addMetadata.Statements.Add(new CodeVariableDeclarationStatement("var", entryVar.VariableName, new CodeObjectCreateExpression(MetadataEntryFullName)));
            addMetadata.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(entryVar, "Key"), new CodeArgumentReferenceExpression("key")));
            addMetadata.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(entryVar, "Value"), new CodeArgumentReferenceExpression("value")));

            addMetadata.Statements.Add(new CodeSnippetStatement());
            addMetadata.Statements.Add(new CodeMethodInvokeExpression(new CodeFieldReferenceExpression(new CodeArgumentReferenceExpression("metricDatum"), "Metadata"), "Add", entryVar));

            _telemetryEventsClass.Members.Add(addMetadata);
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
            var typeDeclaration = new CodeTypeDeclaration(type.GetGeneratedTypeName());
            typeDeclaration.IsStruct = true;
            typeDeclaration.TypeAttributes =
                TypeAttributes.Public | TypeAttributes.Sealed;

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
            // CreateMetricGeneratorMethod(metric);
            // CreateRecordMetricMethod(metric);
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

        /// <summary>
        /// Eg: lambda_invokeRemote => "public static TelemetryEvent CreateLambdaInvokeRemote(...) {...}"
        /// </summary>
        private void CreateMetricGeneratorMethod(Metric metric)
        {
            var metadataParameters = CreateMetadataParameters(metric);

            var method = new CodeMemberMethod
            {
                Attributes = MemberAttributes.Public | MemberAttributes.Static,
                Name = GetCreateMetricMethodName(metric),
                ReturnType = new CodeTypeReference("TelemetryEvent")
            };

            method.Comments.Add(new CodeCommentStatement(metric.description, true));

            // Generate the method signature's parameters
            metadataParameters
                .ToList()
                .ForEach(param => method.Parameters.Add(param));

            // Generate the method body
            var telemetryEventVar = new CodeVariableReferenceExpression("telemetryEvent");
            var telemetryEventDataField = new CodeFieldReferenceExpression(telemetryEventVar, "Data");
            var datumVar = new CodeVariableReferenceExpression("datum");
            var datetimeNow = new CodeMethodReferenceExpression(new CodeTypeReferenceExpression(typeof(DateTime)), "Now");

            // Instantiate TelemetryEvent
            method.Statements.Add(new CodeVariableDeclarationStatement("var", telemetryEventVar.VariableName, new CodeObjectCreateExpression("TelemetryEvent")));
            method.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(telemetryEventVar, "CreatedOn"), datetimeNow));
            method.Statements.Add(new CodeAssignStatement(telemetryEventDataField, new CodeObjectCreateExpression($"List<{MetricDatumFullName}>")));

            // Instantiate MetricDatum
            method.Statements.Add(new CodeSnippetStatement());
            method.Statements.Add(new CodeVariableDeclarationStatement("var", datumVar.VariableName, new CodeObjectCreateExpression(MetricDatumFullName)));
            method.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(datumVar, "MetricName"), new CodePrimitiveExpression(metric.name)));
            method.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(datumVar, "Unit"), GetMetricUnitExpression(metric)));
            method.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(datumVar, "Value"), new CodePrimitiveExpression(1))); // TODO : Is this more dynamic?
            // TODO : All CreateXxx should have CreateTime? and Value? args, then update the Value assignment above

            // Set MetricDatum Metadata values
            metric.metadata?.ToList().ForEach(metadata =>
            {
                method.Statements.Add(new CodeSnippetStatement());

                var parameter = metadataParameters.Single(p => p.Name == metadata.type);
                var argReference = new CodeArgumentReferenceExpression(parameter.Name);

                if (metadata.ResolvedRequired)
                {
                    // Generate: datum.AddMetadata("foo", foo.ToString());
                    var invokeToString = new CodeMethodInvokeExpression(argReference, "ToString");
                    method.Statements.Add(new CodeMethodInvokeExpression(datumVar, "AddMetadata",
                        new CodePrimitiveExpression(metadata.type), invokeToString));
                }
                else
                {
                    // Generate: 
                    // if (foo.HasValue)
                    // {
                    //     datum.AddMetadata("foo", foo.Value.ToString());
                    // }
                    var hasValue = new CodeFieldReferenceExpression(argReference, "HasValue");
                    var invokeToString =
                        new CodeMethodInvokeExpression(new CodeFieldReferenceExpression(argReference, "Value"),
                            "ToString");
                    var addMetadata = new CodeMethodInvokeExpression(datumVar, "AddMetadata",
                        new CodePrimitiveExpression(metadata.type), invokeToString);

                    method.Statements.Add(
                        new CodeConditionStatement(hasValue, new CodeExpressionStatement(addMetadata)));
                }
            });

            // Generate: telemetryEvent.Data.Add(datum);
            method.Statements.Add(new CodeSnippetStatement());
            method.Statements.Add(new CodeMethodInvokeExpression(telemetryEventDataField, "Add", datumVar));

            // Generate: return telemetryEvent;
            method.Statements.Add(new CodeSnippetStatement());
            method.Statements.Add(new CodeMethodReturnStatement(telemetryEventVar));

            _telemetryEventsClass.Members.Add(method);
        }

        // Eg: 'count' -> "Unit.Count"
        private CodeExpression GetMetricUnitExpression(Metric metric)
        {
            var unit = metric.unit ?? "None"; // Fall back to "Unit.None" if there is no metric unit provided
            return new CodeFieldReferenceExpression(new CodeTypeReferenceExpression("Amazon.ToolkitTelemetry.Unit"), unit.ToCamelCase());
        }

        private string GetCreateMetricMethodName(Metric metric)
        {
            return $"Create{SanitizeName(metric.name)}";
        }

        private void CreateRecordMetricMethod(Metric metric)
        {
            var metadataParameters = CreateMetadataParameters(metric).ToList();

            CodeMemberMethod recordMethod = new CodeMemberMethod();
            recordMethod.Attributes = MemberAttributes.Public | MemberAttributes.Static;
            recordMethod.Name = $"Record{SanitizeName(metric.name)}";
            recordMethod.ReturnType = new CodeTypeReference();

            if (!string.IsNullOrWhiteSpace(metric.description))
            {
                recordMethod.Comments.Add(new CodeCommentStatement("Records Telemetry Event:", true));
                recordMethod.Comments.Add(new CodeCommentStatement(metric.description, true));
            }

            // RecordXxx Parameters
            var telemetryLogger = new CodeParameterDeclarationExpression("this ITelemetryLogger", "telemetryLogger");
            recordMethod.Parameters.Add(telemetryLogger);
            metadataParameters.ForEach(param => recordMethod.Parameters.Add(param));

            // Generate: telemetryLogger.Record(CreateXxx(params));
            var createEventInvoke =
                new CodeMethodInvokeExpression(
                    new CodeMethodReferenceExpression(null, GetCreateMetricMethodName(metric)));
            metadataParameters
                .ForEach(parameter =>
                {
                    createEventInvoke.Parameters.Add(new CodeArgumentReferenceExpression(parameter.Name));
                });

            var recordStatement = new CodeMethodInvokeExpression(
                new CodeMethodReferenceExpression(new CodeArgumentReferenceExpression(telemetryLogger.Name), "Record")
            );
            recordStatement.Parameters.Add(createEventInvoke);

            recordMethod.Statements.Add(recordStatement);

            _telemetryEventsClass.Members.Add(recordMethod);
        }

        private void CreateRecordMetricMethodByDataClass(Metric metric)
        {
            // var metadataParameters = CreateMetadataParameters(metric).ToList();

            CodeMemberMethod recordMethod = new CodeMemberMethod();
            recordMethod.Attributes = MemberAttributes.Public | MemberAttributes.Static;
            recordMethod.Name = $"Record{SanitizeName(metric.name)}";
            recordMethod.ReturnType = new CodeTypeReference();

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
            var datetimeNow = new CodeMethodReferenceExpression(new CodeTypeReferenceExpression(typeof(DateTime)), "Now");

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

                // TODO : Bool fields should emit "true"/"false"
                // TODO : String fields could be null, don't call .ToString()
                // TODO : types that are string are not nullable
                //
                if (IsNullable(metadata))
                {
                    // Generate: 
                    // if (foo.HasValue)
                    // {
                    //     datum.AddMetadata("foo", foo.Value.ToString());
                    // }
                    var hasValue = new CodeFieldReferenceExpression(payloadField, "HasValue");
                    var invokeToString =
                        new CodeMethodInvokeExpression(new CodeFieldReferenceExpression(payloadField, "Value"),
                            "ToString");
                    var addMetadata = new CodeMethodInvokeExpression(datumVar, "AddMetadata",
                        new CodePrimitiveExpression(metadata.type), invokeToString);

                    recordMethod.Statements.Add(
                        new CodeConditionStatement(hasValue, new CodeExpressionStatement(addMetadata)));
                }
                else
                {
                    // Generate: datum.AddMetadata("foo", foo.ToString());
                    var invokeToString = new CodeMethodInvokeExpression(payloadField, "ToString");
                    recordMethod.Statements.Add(new CodeMethodInvokeExpression(datumVar, "AddMetadata",
                        new CodePrimitiveExpression(metadata.type), invokeToString));
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

        private IList<CodeParameterDeclarationExpression> CreateMetadataParameters(Metric metric)
        {
            var parameters = new List<CodeParameterDeclarationExpression>();

            // Generate the method's parameters
            metric.metadata?
                .OrderBy(metadata => metadata.ResolvedRequired ? 0 : 1) // put all required metrics first
                .ThenBy(metadata => metadata.type)
                .ToList().ForEach(metadata =>
                {
                    var metricType = GetMetricType(metadata.type);

                    var generatedTypeName = metadata.ResolvedRequired
                        ? metricType.GetGeneratedTypeName()
                        : $"{metricType.GetGeneratedTypeName()}?";
                    var param = new CodeParameterDeclarationExpression(generatedTypeName, metadata.type);
                    parameters.Add(param);
                });

            return parameters;
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