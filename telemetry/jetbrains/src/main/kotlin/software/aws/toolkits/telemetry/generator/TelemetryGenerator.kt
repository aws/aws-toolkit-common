// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import com.squareup.kotlinpoet.BOOLEAN
import com.squareup.kotlinpoet.ClassName
import com.squareup.kotlinpoet.DOUBLE
import com.squareup.kotlinpoet.FileSpec
import com.squareup.kotlinpoet.FunSpec
import com.squareup.kotlinpoet.KModifier
import com.squareup.kotlinpoet.MemberName
import com.squareup.kotlinpoet.ParameterSpec
import com.squareup.kotlinpoet.PropertySpec
import com.squareup.kotlinpoet.TypeSpec
import java.io.File
import java.time.Instant

object TelemetryGenerator {
    private const val PACKAGE_NAME = "software.aws.toolkits.telemetry"
    private const val RESULT = "result"

    private fun String.filterInvalidCharacters() = this.replace(".", "")
    private fun String.toTypeFormat() = this.filterInvalidCharacters().capitalize()
    private fun String.toArgumentFormat() = this.filterInvalidCharacters().toLowerCase()

    fun generateTelemetryFromFiles(
        inputFiles: List<File>,
        defaultDefinitions: List<String> = ResourceLoader.DEFINITIONS_FILES,
        outputFolder: File
    ) {
        val telemetry = TelemetryParser.parseFiles(inputFiles, defaultDefinitions)
        val output = FileSpec.builder(PACKAGE_NAME, "TelemetryDefinitions")
        generateHeader(output)
        telemetry.types?.let { generateTelemetryEnumTypes(output, it) }
        generateTelemetryObjects(output, telemetry)
        // make sure the output directory exists before writing to it
        outputFolder.mkdirs()
        output.build().writeTo(outputFolder)
    }

    private fun generateHeader(output: FileSpec.Builder) {
        output.addComment("Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.\n")
        output.addComment("SPDX-License-Identifier: Apache-2.0\n")
        output.addComment("THIS FILE IS GENERATED! DO NOT EDIT BY HAND!")
    }

    private fun generateTelemetryEnumTypes(output: FileSpec.Builder, items: List<TelemetryMetricType>) {
        items.forEach {
            // We only need to generate enums if they are actually enums, skip other types
            if (it.allowedValues == null) {
                return@forEach
            }
            generateTelemetryEnumType(output, it)
        }
    }

    private fun generateTelemetryEnumType(output: FileSpec.Builder, item: TelemetryMetricType) {
        val enum = TypeSpec.enumBuilder(item.name.toTypeFormat())
            .primaryConstructor(
                FunSpec.constructorBuilder()
                    .addParameter("value", String::class)
                    .build()
            )
            .addProperty(PropertySpec.builder("value", String::class).initializer("value").build())
            .addFunction(FunSpec.builder("toString").addModifiers(KModifier.OVERRIDE).returns(String::class).addStatement("return value").build())
            .addKdoc(item.description)

        item.allowedValues!!.forEach { enumValue ->
            enum.addEnumConstant(
                enumValue.toString().toUpperCase().filterInvalidCharacters(), TypeSpec.anonymousClassBuilder()
                    .addSuperclassConstructorParameter("%S", enumValue.toString())
                    .build()
            )
        }

        val companion = TypeSpec.companionObjectBuilder()
            .addFunction(
                FunSpec.builder("from")
                    .returns(ClassName("", item.name.toTypeFormat()))
                    .addParameter("type", Any::class)
                    .addStatement("return values().first { it.value == type.toString() }")
                    .build()
            )
            .build()

        enum.addType(companion)

        output.addType(enum.build())
    }

    private fun generateTelemetryObjects(output: FileSpec.Builder, item: TelemetryDefinition) =
        item
            .metrics
            .sortedBy { it.name }
            .groupBy { it.name.split("_").first().toLowerCase() }
            .forEach { metrics: Map.Entry<String, List<Metric>> -> generateNamespaces(output, item.types!!, metrics.key, metrics.value) }

    private fun generateNamespaces(output: FileSpec.Builder, types: List<TelemetryMetricType>, namespaceType: String, metrics: List<Metric>) {
        val namespace = TypeSpec.objectBuilder("${namespaceType.toTypeFormat()}Telemetry")
        metrics.forEach { generateRecordFunctions(it, types, namespace) }
        output.addType(namespace.build())
    }

    private fun generateRecordFunctions(metric: Metric, types: List<TelemetryMetricType>, namespace: TypeSpec.Builder) {
        // metric.name.split("_")[1] is guaranteed to work at this point because the schema requires the metric name to have at least 1 underscore
        val functionName = metric.name.split("_")[1]
        val parameters = buildParameters(metric, types)
        val functionBuilder = FunSpec.builder(functionName)
        generateFunctionParameters(functionBuilder, parameters)
        generateFunctionBody(functionBuilder, metric)
        namespace.addFunction(functionBuilder.build())
        // Result is special cased to generate a function that accepts true/false as well
        if (metric.metadata?.any { it.type == RESULT } != true) {
            return
        }
        val function2 = FunSpec.builder(functionName)
        val parameters2 = parameters.map {
            if (it.name == RESULT) {
                ParameterSpec.builder(it.name, BOOLEAN).build()
            } else {
                it
            }
        }
        generateFunctionParameters(function2, parameters2)
        generateFunctionBody(function2, metric, boolResultField = true)
        namespace.addFunction(function2.build())
    }

    private fun buildParameters(metric: Metric, types: List<TelemetryMetricType>) = metric.metadata?.map { metadata ->
        val telemetryMetricType = types.find { it.name == metadata.type }
            ?: throw IllegalStateException("Type ${metadata.type} on ${metric.name} not found in types!")
        val typeName = if (telemetryMetricType.allowedValues != null) {
            ClassName(PACKAGE_NAME, telemetryMetricType.name.toTypeFormat())
        } else {
            telemetryMetricType.type?.getTypeFromType() ?: com.squareup.kotlinpoet.STRING
        }.copy(nullable = metadata.required == false)

        val parameterSpec = ParameterSpec.builder(telemetryMetricType.name.toArgumentFormat(), typeName)
        if (metadata.required == false) {
            parameterSpec.defaultValue("null")
        }
        parameterSpec.build()
    } ?: listOf()

    private fun generateFunctionParameters(functionBuilder: FunSpec.Builder, additionalParameters: List<ParameterSpec>) {
        val projectParameter = ClassName("com.intellij.openapi.project", "Project").copy(nullable = true)
        functionBuilder
            .addParameter(ParameterSpec.builder("project", projectParameter).defaultValue("null").build())
            .addParameters(additionalParameters)
            .addParameter(ParameterSpec.builder("value", DOUBLE).defaultValue("1.0").build())
            .addParameter(ParameterSpec.builder("createTime", Instant::class).defaultValue("Instant.now()").build())
    }

    private fun generateFunctionBody(functionBuilder: FunSpec.Builder, metric: Metric, boolResultField: Boolean = false) {
        val telemetryClient = MemberName("software.aws.toolkits.jetbrains.services.telemetry", "TelemetryService")
        val metricUnit = MemberName("software.amazon.awssdk.services.toolkittelemetry.model", "Unit")
        functionBuilder
            .addStatement("%M.getInstance().record(project) { ", telemetryClient)
            .addStatement("datum(%S) {", metric.name)
            .addStatement("createTime(createTime)")
            .addStatement("unit(%M.${(metric.unit ?: MetricUnit.NONE).name})", metricUnit)
            .addStatement("value(value)")
        metric.metadata?.forEach {
            if (boolResultField && it.type == RESULT) {
                generateMetadataStatement(functionBuilder, it, "if(result) Result.SUCCEEDED.toString() else Result.FAILED.toString()")
            } else {
                generateMetadataStatement(functionBuilder, it, "${it.type.toArgumentFormat()}.toString()")
            }
        }
        functionBuilder.addStatement("}}")
        functionBuilder.addKdoc(metric.description)
    }

    private fun generateMetadataStatement(
        functionBuilder: FunSpec.Builder,
        data: Metadata,
        setStatement: String
    ) {
        if (data.required == false) {
            functionBuilder.beginControlFlow("if(%L != null) {", data.type.toArgumentFormat())
        }
        functionBuilder.addStatement("metadata(%S, %L)", data.type.toArgumentFormat(), setStatement)
        if (data.required == false) {
            functionBuilder.endControlFlow()
        }
    }
}
