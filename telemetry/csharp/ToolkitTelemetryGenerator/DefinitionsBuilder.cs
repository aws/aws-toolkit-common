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

            // public sealed class ToolkitTelemetryEvent (contains generated code)
            _telemetryEventsClass = new CodeTypeDeclaration("ToolkitTelemetryEvent");
            _telemetryEventsClass.IsClass = true;
            _telemetryEventsClass.TypeAttributes = TypeAttributes.Public | TypeAttributes.Sealed;
            _generatedNamespace.Types.Add(_telemetryEventsClass);

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
                _blankNamespace.Imports.Add(new CodeNamespaceImport($"{type.GetGeneratedTypeName()} = {type.GetAliasedTypeName()}"));
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
                // TODO : Process value into a clean enum value
                CodeMemberField field = new CodeMemberField($"readonly {type.GetGeneratedTypeName()}", allowedValue.ToCamelCase().Replace(".", ""));
                field.InitExpression = new CodePrimitiveExpression(allowedValue);
                field.InitExpression = new CodeObjectCreateExpression(type.GetGeneratedTypeName(), new CodeExpression[]{ new CodePrimitiveExpression(allowedValue) });
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
            var method = new CodeMemberMethod();

            method.Attributes = MemberAttributes.Public | MemberAttributes.Static;
            method.Name = $"Create{SanitizeName(metric.name)}";
            method.ReturnType = new CodeTypeReference("TelemetryEvent"); // TelemetryEvent is an in-toolkit datatype
            method.Comments.Add(new CodeCommentStatement(metric.description, true));

            // Generate the method's parameters
            metric.metadata?
                .OrderBy(x => x.required.Value ? 0 : 1) // put all required metrics first
                .ThenBy(x => x.type)
                .ToList().ForEach(metadata =>
                {
                    // TODO : handle if metadata.required is supposed to default to true when not present
                    Console.WriteLine($"{metadata.type}, {metadata.required}");

                    var type = GetMetricType(metadata.type);

                    // var param = new CodeParameterDeclarationExpression(metadata.type, metadata.type);
                    var isRequired = !metadata.required.HasValue || metadata.required.Value;
                    var generatedTypeName = isRequired ? type.GetGeneratedTypeName() : $"{type.GetGeneratedTypeName()}?";
                    var param = new CodeParameterDeclarationExpression(generatedTypeName, metadata.type);
                    method.Parameters.Add(param);

                    // TODO : Generate these params in a common method. Need them for the RecordXXX calls too
                });

            // TODO : Body of method: Produce the TelemetryEvent and return it
            // TODO : metric.unit ?? "None"

            // TODO : Produce a TelemetryEvent and return it
            method.Statements.Add(new CodeMethodReturnStatement(new CodePrimitiveExpression(null))); // "return null;"

            _telemetryEventsClass.Members.Add(method);
        }

        private void CreateRecordMetricMethod(Metric metric)
        {

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
                    .Split(new char[] { '.', ',', '_', '-' }, StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.ToCamelCase())
                );
        }
    }

}