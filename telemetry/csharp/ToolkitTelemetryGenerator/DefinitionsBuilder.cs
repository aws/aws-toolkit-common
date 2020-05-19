﻿using System;
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
            _telemetryEventsClass.TypeAttributes = TypeAttributes.Public | TypeAttributes.Sealed;
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
                return writer.ToString();
            }
        }

        private void GenerateFixedCode()
        {
            GenerateTelemetryEventClass();
            GenerateTelemetryLoggerClass();
            // TODO : Generate extension method AddMetadata on MetricDatum objects
            // public static void AddMetadata(this MetricDatum metricDatum, string key, string value)
            // {
            //     metricDatum.Metadata.Add(new MetadataEntry()
            //     {
            //         Key = key,
            //         Value = value
            //     });
            // }
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
            var dataField = new CodeMemberField("IList<Amazon.ToolkitTelemetry.Model.MetricDatum>", "Data")
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

        private void ProcessMetricTypes()
        {
            _types.ForEach(ProcessMetricType);
        }

        internal void ProcessMetricType(MetricType type)
        {
            // Handle POCO types
            // eg: name: duration, type: double  =>  using Duration = System.double;
            if (type.IsAliasedType())
            {
                _blankNamespace.Imports.Add(
                    new CodeNamespaceImport($"{type.GetGeneratedTypeName()} = {type.GetAliasedTypeName()}"));
            }
            else
            {
                // Generate Enum style Classes for types with allowed Values
                // eg: "name": "runtime", "allowedValues": [ "dotnetcore2.1", "nodejs12.x" ]
                GenerateEnumClass(type);
            }
        }

        private void GenerateEnumClass(MetricType type)
        {
            var typeDeclaration = new CodeTypeDeclaration(type.GetGeneratedTypeName());
            typeDeclaration.IsClass = true;
            typeDeclaration.TypeAttributes =
                TypeAttributes.Public | TypeAttributes.Sealed;

            if (!string.IsNullOrWhiteSpace(type.description))
            {
                typeDeclaration.Comments.Add(new CodeCommentStatement(type.description, true));
            }

            // TODO : Put ToString methods on the Enum Classes
            var valueField = new CodeMemberField(typeof(string), "Value");
            valueField.Attributes = MemberAttributes.Public;
            typeDeclaration.Members.Add(valueField);

            var typeConstructor = new CodeConstructor();
            typeConstructor.Attributes = MemberAttributes.Public;
            typeConstructor.Parameters.Add(new CodeParameterDeclarationExpression("System.string", "value"));

            // this.Value = value;
            var xref = new CodeFieldReferenceExpression(new CodeThisReferenceExpression(), "Value");
            typeConstructor.Statements.Add(new CodeAssignStatement(xref, new CodeArgumentReferenceExpression("value")));

            typeDeclaration.Members.Add(typeConstructor);

            type.allowedValues.Select(allowedValue =>
            {
                CodeMemberField field = new CodeMemberField($"readonly {type.GetGeneratedTypeName()}",
                    allowedValue.ToCamelCase().Replace(".", ""));
                field.InitExpression = new CodePrimitiveExpression(allowedValue);
                field.InitExpression = new CodeObjectCreateExpression(type.GetGeneratedTypeName(),
                    new CodeExpression[] {new CodePrimitiveExpression(allowedValue)});
                field.Attributes = MemberAttributes.Static | MemberAttributes.Public;
                field.Comments.Add(new CodeCommentStatement(allowedValue, true));

                return field;
            }).ToList().ForEach(enumField => typeDeclaration.Members.Add(enumField));

            _generatedNamespace.Types.Add(typeDeclaration);
        }

        private void ProcessMetrics()
        {
            _metrics.ForEach(ProcessMetric);
        }

        private void ProcessMetric(Metric metric)
        {
            CreateMetricGeneratorMethod(metric);
            CreateRecordMetricMethod(metric);
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
            method.Statements.Add(new CodeVariableDeclarationStatement("var", telemetryEventVar.VariableName, new CodeObjectCreateExpression(telemetryEventVar.VariableName)));
            method.Statements.Add(new CodeAssignStatement(new CodeFieldReferenceExpression(telemetryEventVar, "CreatedOn"), datetimeNow));
            method.Statements.Add(new CodeAssignStatement(telemetryEventDataField, new CodeObjectCreateExpression($"List<{MetricDatumFullName}>")));

            // Instantiate MetricDatum
            method.Statements.Add(new CodeSnippetStatement());
            method.Statements.Add(new CodeAssignStatement(datumVar, new CodeObjectCreateExpression(MetricDatumFullName)));
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
            // TODO : have this Builder generate ITelemetryLogger interface
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