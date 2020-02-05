// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import com.squareup.kotlinpoet.ClassName
import com.squareup.kotlinpoet.DOUBLE
import com.squareup.kotlinpoet.FileSpec
import com.squareup.kotlinpoet.FunSpec
import com.squareup.kotlinpoet.KModifier
import com.squareup.kotlinpoet.MemberName
import com.squareup.kotlinpoet.ParameterSpec
import com.squareup.kotlinpoet.PropertySpec
import org.slf4j.Logger
import com.squareup.kotlinpoet.TypeSpec
import java.io.File

object TelemetryGenerator {
    private const val PACKAGE_NAME = "software.aws.toolkits.telemetry"

    private fun String.filterInvalidCharacters() = this.replace(".", "")
    private fun String.toTypeFormat() = this.filterInvalidCharacters().capitalize()
    private fun String.toArgumentFormat() = this.filterInvalidCharacters().toLowerCase()

    fun generateTelemetryFromFiles(
        inputFiles: List<File>,
        defaultDefinitions: List<String> = listOf(ResourceLoader.DEFINITONS_FILE, ResourceLoader.JETBRAINS_DEFINITONS_FILE),
        outputFolder: File
    ) {
        val telemetry = TelemetryParser.parseFiles(inputFiles, defaultDefinitions)
        val output = FileSpec.builder(PACKAGE_NAME, "TelemetryDefinitions")
        output.addImport("software.aws.toolkits.core.utils", "getLogger")
        output.addComment("THIS FILE IS GENERATED! DO NOT EDIT BY HAND!")
        telemetry.types?.let { generateTelemetryEnumTypes(output, it) }
        generateTelemetry(output, telemetry)
        output.build().writeTo(outputFolder)
    }

    private fun generateTelemetryEnumType(output: FileSpec.Builder, item: TelemetryMetricType) {
        val enum = TypeSpec.enumBuilder(item.name.toTypeFormat())
            .primaryConstructor(
                FunSpec.constructorBuilder()
                    .addParameter("name", String::class)
                    .build()
            )
            .addFunction(FunSpec.builder("toString").addModifiers(KModifier.OVERRIDE).returns(String::class).addStatement("return name").build())
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
                    .returns(ClassName("", item.name.toTypeFormat()).copy(nullable = true))
                    .addParameter("type", Any::class)
                    .addStatement("val result = values().firstOrNull { it.name == type.toString() }")
                    .beginControlFlow("if(result == null)")
                    .addStatement("LOG.warn(\"Invalid property \${type.toString()} passed into %L\"", item.name.toTypeFormat())
                    .endControlFlow()
                    .addStatement("return result").build()
            )
            .addProperty(PropertySpec.builder("LOG", Logger::class).initializer("getLogger<%L>()", item.name.toTypeFormat()).build())
            .build()

        enum.addType(companion)

        output.addType(enum.build())
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

    private fun generateTelemetry(output: FileSpec.Builder, item: TelemetryDefinition) =
        item
            .metrics
            .sortedBy { it.name }
            .groupBy { it.name.split("_").first().toLowerCase() }
            .forEach { metrics: Map.Entry<String, List<Metric>> -> generateNamespaces(output, item.types!!, metrics.key, metrics.value) }

    private fun generateFunctionParameters(functionBuilder: FunSpec.Builder, metric: Metric, types: List<TelemetryMetricType>) {
        val projectParameter = ClassName("com.intellij.openapi.project", "Project").copy(nullable = true)
        val valueParameter = DOUBLE
        val additionalParameters = metric.metadata?.map { metadata ->
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
        functionBuilder
            .addParameter(ParameterSpec.builder("project", projectParameter).defaultValue("null").build())
            .addParameters(additionalParameters)
            .addParameter(ParameterSpec.builder("value", valueParameter).defaultValue("1.0").build())
    }

    private fun generateFunctionBody(functionBuilder: FunSpec.Builder, metric: Metric) {
        val telemetryClient = MemberName("software.aws.toolkits.jetbrains.services.telemetry", "TelemetryService")
        val metricUnit = MemberName("software.amazon.awssdk.services.toolkittelemetry.model", "Unit")
        functionBuilder
            .addStatement("%M.getInstance().record(project) { ", telemetryClient)
            .addStatement("datum(%S) {", metric.name)
            .addStatement("unit(%M.${(metric.unit ?: MetricUnit.NONE).name})", metricUnit)
            .addStatement("value(value)")
        metric.metadata?.forEach {
            if (it.required == false) {
                functionBuilder.beginControlFlow("if(%L != null) {", it.type.toArgumentFormat())
            }
            functionBuilder.addStatement("metadata(%S, %L.toString())", it.type.toArgumentFormat(), it.type.toArgumentFormat())
            if (it.required == false) {
                functionBuilder.endControlFlow()
            }
        }
        functionBuilder.addStatement("}}")
        functionBuilder.addKdoc(metric.description)
    }

    private fun generateRecordFunction(metric: Metric, types: List<TelemetryMetricType>, namespace: TypeSpec.Builder) {
        // metric.name.split("_")[1] is guaranteed to exist at this point because the schema requires the metric name to have at least 1 underscore
        val functionBuilder = FunSpec.builder("record${metric.name.split("_")[1].toTypeFormat()}")
        generateFunctionParameters(functionBuilder, metric, types)
        generateFunctionBody(functionBuilder, metric)
        namespace.addFunction(functionBuilder.build())
    }

    private fun generateNamespaces(output: FileSpec.Builder, types: List<TelemetryMetricType>, namespaceType: String, metrics: List<Metric>) {
        val namespace = TypeSpec.objectBuilder("${namespaceType.toTypeFormat()}Telemetry")
        metrics.forEach { generateRecordFunction(it, types, namespace) }
        output.addType(namespace.build())
    }
}
