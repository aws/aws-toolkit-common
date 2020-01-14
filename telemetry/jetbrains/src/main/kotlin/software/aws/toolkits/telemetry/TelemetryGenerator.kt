// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry

import com.squareup.kotlinpoet.ClassName
import com.squareup.kotlinpoet.FileSpec
import com.squareup.kotlinpoet.FunSpec
import com.squareup.kotlinpoet.KModifier
import com.squareup.kotlinpoet.MemberName
import com.squareup.kotlinpoet.ParameterSpec
import com.squareup.kotlinpoet.TypeSpec
import java.io.File

val PACKAGE_NAME = "software.aws.toolkits.telemetry"

fun String.filterInvalidCharacters() = this.replace(".", "")
fun String.toTypeFormat() = this.filterInvalidCharacters().capitalize()
fun String.toArgumentFormat() = this.filterInvalidCharacters().toLowerCase()

fun generateTelemetryEnumTypes(output: FileSpec.Builder, items: List<TelemetryMetricType>) {
    items.forEach {
        if (it.allowedValues == null) {
            return@forEach
        }
        val enum = TypeSpec.enumBuilder(it.name.toTypeFormat())
            .primaryConstructor(
                FunSpec.constructorBuilder()
                    .addParameter("name", String::class)
                    .build()
            )
        it.allowedValues.forEach { enumValue ->
            enum.addEnumConstant(
                enumValue.toString().toUpperCase().filterInvalidCharacters(), TypeSpec.anonymousClassBuilder()
                    .addSuperclassConstructorParameter("%S", enumValue.toString())
                    .build()
            )
        }
        enum.addFunction(FunSpec.builder("toString").addModifiers(KModifier.OVERRIDE).returns(String::class).addStatement("return name").build())
        enum.addFunction(
            FunSpec.builder("from").returns(ClassName("", it.name.toTypeFormat())).addParameter(
                "type",
                Any::class
            ).addStatement("return values().filter { it.name == type.toString() }.first()").build()
        )
        enum.addKdoc(it.description)
        output.addType(enum.build())
    }
}

fun generateRecordFunctions(output: FileSpec.Builder, items: TelemetryDefinition) {
    val telemetryClient = MemberName("software.aws.toolkits.jetbrains.services.telemetry", "TelemetryService")
    val metricUnit = MemberName("software.amazon.awssdk.services.toolkittelemetry.model", "Unit")
    items
        .metrics
        .sortedBy { it.name }
        .groupBy { it.name.split("_").first().toLowerCase() }
        .forEach { metrics: Map.Entry<String, List<Metric>> ->
            val namespace = TypeSpec.objectBuilder("${metrics.key.toTypeFormat()}Telemetry")
            metrics.value.forEach { metric ->
                val functionBuilder = FunSpec.builder("record${metric.name.split("_")[1].toTypeFormat()}")
                // generate parameters
                val projectParameter = ClassName("com.intellij.openapi.project", "Project").copy(nullable = true)
                val valueParameter = com.squareup.kotlinpoet.DOUBLE
                val additionalParameters = metric.metadata?.map { metadata ->
                    val telemetryMetricType =
                        items.types?.find { it.name == metadata.type }
                            ?: throw IllegalStateException("Type ${metadata.type} on ${metric.name} not found in types!")
                    val typeName = if (telemetryMetricType.allowedValues != null) {
                        ClassName(PACKAGE_NAME, telemetryMetricType.name.toTypeFormat())
                    } else {
                        telemetryMetricType.type?.getTypeFromType() ?: com.squareup.kotlinpoet.STRING
                    }.copy(nullable = metadata.required ?: false)
                    ParameterSpec(telemetryMetricType.name.toArgumentFormat(), typeName)
                } ?: listOf()
                functionBuilder
                    .addParameter("project", projectParameter)
                    .addParameter(ParameterSpec.builder("value", valueParameter).defaultValue("1.0").build())
                    .addParameters(additionalParameters)
                // generate body
                functionBuilder
                    .addStatement("%M.getInstance().record(project) { ", telemetryClient)
                    .addStatement("datum(%S) {", metric.name)
                    .addStatement("unit(%M.${(metric.unit ?: MetricUnit.NONE).name})", metricUnit)
                    .addStatement("value(value)")
                metric.metadata?.forEach {
                    functionBuilder.addStatement("metadata(%S, %L.toString())", it.type.toArgumentFormat(), it.type.toArgumentFormat())
                }
                functionBuilder.addStatement("}}")
                functionBuilder.addKdoc(metric.description)
                namespace.addFunction(functionBuilder.build())
            }
            output.addType(namespace.build())
        }
}

fun generateTelemetryFromFiles(inputFiles: List<File>, outputFolder: File, defaultDefinitions: String = ResourceLoader.DEFINITONS_FILE) {
    val telemetry = TelemetryParser.parseFiles(inputFiles, defaultDefinitions)
    val output = FileSpec.builder(PACKAGE_NAME, "TelemetryDefinitions")
    output.addComment("THIS FILE IS GENERATED! DO NOT EDIT BY HAND!")
    telemetry.types?.let { generateTelemetryEnumTypes(output, it) }
    generateRecordFunctions(output, telemetry)
    output.build().writeTo(outputFolder)
}
