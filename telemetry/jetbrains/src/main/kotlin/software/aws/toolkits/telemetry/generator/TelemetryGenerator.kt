// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import com.squareup.kotlinpoet.AnnotationSpec
import com.squareup.kotlinpoet.BOOLEAN
import com.squareup.kotlinpoet.ClassName
import com.squareup.kotlinpoet.DOUBLE
import com.squareup.kotlinpoet.FileSpec
import com.squareup.kotlinpoet.FunSpec
import com.squareup.kotlinpoet.KModifier
import com.squareup.kotlinpoet.MemberName
import com.squareup.kotlinpoet.ParameterSpec
import com.squareup.kotlinpoet.PropertySpec
import com.squareup.kotlinpoet.STRING
import com.squareup.kotlinpoet.TypeSpec
import java.io.File
import java.time.Instant

const val PACKAGE_NAME = "software.aws.toolkits.telemetry"

const val JETBRAINS_TELEMETRY_PACKAGE_NAME = "software.aws.toolkits.jetbrains.services.telemetry"
val METRIC_METADATA = ClassName(JETBRAINS_TELEMETRY_PACKAGE_NAME, "MetricEventMetadata")
val TELEMETRY_SERVICE = ClassName(JETBRAINS_TELEMETRY_PACKAGE_NAME, "TelemetryService")
val PROJECT = ClassName("com.intellij.openapi.project", "Project").copy(nullable = true)
val CONNECTION_SETTINGS = ClassName("software.aws.toolkits.core", "ConnectionSettings").copy(nullable = true)

const val RESULT = "result"
const val SUCCESS = "success"

fun String.filterInvalidCharacters() = this.replace(".", "")
fun String.toTypeFormat() = this.filterInvalidCharacters().split("_", "-").joinToString(separator = "") { it.capitalize() }

fun String.toArgumentFormat() = this.toTypeFormat().decapitalize()

fun generateTelemetryFromFiles(
    inputFiles: List<File>,
    defaultDefinitions: List<String> = ResourceLoader.DEFINITIONS_FILES,
    outputFolder: File
) {
    val telemetry = TelemetryParser.parseFiles(defaultDefinitions, inputFiles)
    // make sure the output directory exists before writing to it
    outputFolder.mkdirs()
    FileSpec.builder(PACKAGE_NAME, "TelemetryDefinitions")
        .indent(" ".repeat(4))
        .generateHeader()
        .generateTelemetryEnumTypes(telemetry.types)
        .generateTelemetryObjects(telemetry.metrics)
        .build()
        .writeTo(outputFolder)
}

private fun FileSpec.Builder.generateHeader(): FileSpec.Builder {
    addComment("Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.\n")
    addComment("SPDX-License-Identifier: Apache-2.0\n")
    addComment("THIS FILE IS GENERATED! DO NOT EDIT BY HAND!")
    addAnnotation(AnnotationSpec.builder(Suppress::class).addMember("\"unused\", \"MemberVisibilityCanBePrivate\"").build())

    return this
}

private fun FileSpec.Builder.generateTelemetryEnumTypes(items: List<TelemetryMetricType>): FileSpec.Builder {
    items.forEach {
        // We only need to generate enums if they are actually enums, skip other types
        if (it.allowedValues == null) {
            return@forEach
        }
        generateTelemetryEnumType(it)
    }

    return this
}

private fun FileSpec.Builder.generateTelemetryEnumType(item: TelemetryMetricType): FileSpec.Builder {
    val enum = TypeSpec.enumBuilder(item.name.toTypeFormat())
        .primaryConstructor(
            FunSpec.constructorBuilder()
                .addParameter("value", String::class, KModifier.PRIVATE)
                .build()
        )
        .addProperty(PropertySpec.builder("value", String::class).initializer("value").build())
        .addFunction(FunSpec.builder("toString").addModifiers(KModifier.OVERRIDE).returns(String::class).addStatement("return value").build())
        .addKdoc(item.description)

    item.allowedValues!!.forEach { enumValue ->
        enum.addEnumConstant(
            enumValue.toString().toTypeFormat(), TypeSpec.anonymousClassBuilder()
                .addSuperclassConstructorParameter("%S", enumValue.toString())
                .build()
        )
    }

    // Add an unknown value
    val unknownType = "unknown".toTypeFormat()

    enum.addEnumConstant(
        unknownType,
        TypeSpec.anonymousClassBuilder()
            .addSuperclassConstructorParameter("%S", "unknown")
            .build()
    ).build()

    val companion = TypeSpec.companionObjectBuilder()
        .addFunction(
            FunSpec.builder("from")
                .returns(ClassName("", item.name.toTypeFormat()))
                .addParameter("type", String::class)
                .addStatement("return values().firstOrNull { it.value == type } ?: $unknownType")
                .build()
        )
        .build()

    enum.addType(companion)

    addType(enum.build())

    return this
}

private fun FileSpec.Builder.generateTelemetryObjects(schema: List<MetricSchema>): FileSpec.Builder {
    schema.groupBy { it.namespace() }
        .toSortedMap()
        .forEach { (namespace, metrics) -> generateNamespaces(namespace, metrics) }

    return this
}

private fun FileSpec.Builder.generateNamespaces(namespace: String, metrics: List<MetricSchema>): FileSpec.Builder {
    val telemetryObject = TypeSpec.objectBuilder("${namespace.toTypeFormat()}Telemetry")

    metrics.sortedBy { it.name }.forEach { telemetryObject.generateRecordFunctions(it) }

    addType(telemetryObject.build())

    return this
}

private fun TypeSpec.Builder.generateRecordFunctions(metric: MetricSchema) {
    // metric.name.split("_")[1] is guaranteed to work at this point because the schema requires the metric name to have at least 1 underscore
    val functionName = metric.name.split("_")[1]

    addFunction(buildProjectFunction(functionName, metric))
    addFunction(buildConnectionSettingsFunction(functionName, metric))
    addFunction(buildMetricMetadataFunction(functionName, metric))

    // Result is special cased to generate a function that accepts true/false instead of a Result
    if (metric.metadata.none { it.type.name == RESULT }) {
        return
    }

    addFunction(buildProjectOverloadFunction(functionName, metric))
    addFunction(buildConnectionSettingsOverloadFunction(functionName, metric))
    addFunction(buildMetricMetadataOverloadFunction(functionName, metric))
}

fun buildProjectFunction(functionName: String, metric: MetricSchema): FunSpec {
    val metadataProvider = ParameterSpec.builder("project", PROJECT).build()

    return buildRecordFunction(metadataProvider, functionName, metric)
}

fun buildConnectionSettingsFunction(functionName: String, metric: MetricSchema): FunSpec {
    val metadataProvider = ParameterSpec.builder("connectionSettings", CONNECTION_SETTINGS).defaultValue("null").build()

    return buildRecordFunction(metadataProvider, functionName, metric)
}

fun buildMetricMetadataFunction(functionName: String, metric: MetricSchema): FunSpec {
    val metadataProvider = ParameterSpec.builder("metadata", METRIC_METADATA).build()

    return buildRecordFunction(metadataProvider, functionName, metric)
}

private fun buildRecordFunction(metadataProvider: ParameterSpec, functionName: String, metric: MetricSchema): FunSpec {
    val functionParameters = mutableListOf<ParameterSpec>()
    functionParameters.add(metadataProvider)
    functionParameters.addAll(buildMetricParameters(metric))

    return FunSpec.builder(functionName)
        .addKdoc(metric.description)
        .addParameters(functionParameters)
        .generateFunctionBody(metadataProvider, metric)
        .build()
}

private fun buildMetricParameters(metric: MetricSchema): List<ParameterSpec> {
    val list = mutableListOf<ParameterSpec>()

    list.addAll(metric.metadata.map { it.metadataToParameter() })
    list.add(ParameterSpec.builder("passive", BOOLEAN).defaultValue(metric.passive.toString()).build())
    list.add(ParameterSpec.builder("value", DOUBLE).defaultValue("1.0").build())
    list.add(ParameterSpec.builder("createTime", Instant::class).defaultValue("Instant.now()").build())

    return list
}

private fun MetadataSchema.metadataToParameter(): ParameterSpec {
    // Allowed values indicates an enum
    val typeName = if (type.allowedValues != null) {
        ClassName(PACKAGE_NAME, type.name.toTypeFormat())
    } else {
        type.type.kotlinType()
    }.copy(nullable = required == false)

    val parameterSpec = ParameterSpec.builder(type.name.toArgumentFormat(), typeName)
    if (required == false) {
        parameterSpec.defaultValue("null")
    }
    return parameterSpec.build()
}

private fun FunSpec.Builder.generateFunctionBody(metadataParameter: ParameterSpec, metric: MetricSchema): FunSpec.Builder {
    val metricUnit = MemberName("software.amazon.awssdk.services.toolkittelemetry.model", "Unit")
    beginControlFlow("%T.getInstance().record(${metadataParameter.name})", TELEMETRY_SERVICE)
    beginControlFlow("datum(%S)", metric.name)
    addStatement("createTime(createTime)")
    addStatement("unit(%M.${(metric.unit ?: MetricUnit.NONE).name})", metricUnit)
    addStatement("value(value)")
    addStatement("passive(passive)")
    metric.metadata.forEach {
        generateMetadataStatement(it)
    }
    endControlFlow()
    endControlFlow()

    return this
}

fun buildProjectOverloadFunction(functionName: String, metric: MetricSchema): FunSpec {
    val metadataProvider = ParameterSpec.builder("project", PROJECT).defaultValue("null").build()

    return buildResultOverloadFunction(metadataProvider, functionName, metric)
}

fun buildConnectionSettingsOverloadFunction(functionName: String, metric: MetricSchema): FunSpec {
    val metadataProvider = ParameterSpec.builder("connectionSettings", CONNECTION_SETTINGS).defaultValue("null").build()
    return buildResultOverloadFunction(metadataProvider, functionName, metric)
}

fun buildMetricMetadataOverloadFunction(functionName: String, metric: MetricSchema): FunSpec {
    val metadataProvider = ParameterSpec.builder("metadata", METRIC_METADATA).build()

    return buildResultOverloadFunction(metadataProvider, functionName, metric)
}

fun buildResultOverloadFunction(metadataProvider: ParameterSpec, functionName: String, metric: MetricSchema): FunSpec {
    val overloadedParameters = buildMetricParameters(metric).map {
        if (it.name == RESULT) {
            ParameterSpec.builder(SUCCESS, BOOLEAN).build()
        } else {
            it
        }
    }

    val functionParameters = mutableListOf<ParameterSpec>()
    functionParameters.add(metadataProvider)
    functionParameters.addAll(overloadedParameters)

    return FunSpec.builder(functionName)
        .addKdoc(metric.description)
        .addParameters(functionParameters)
        .generateResultOverloadFunctionBody(functionName, functionParameters)
        .build()
}

private fun FunSpec.Builder.generateResultOverloadFunctionBody(functionName: String, parameters: List<ParameterSpec>): FunSpec.Builder {
    addStatement("%L(%L)", functionName, parameters.joinToString {
        if (it.name != SUCCESS) {
            it.name
        } else {
            "if($SUCCESS) Result.Succeeded else Result.Failed"
        }
    })

    return this
}

private fun FunSpec.Builder.generateMetadataStatement(data: MetadataSchema): FunSpec.Builder {
    if (data.required == false) {
        beginControlFlow("if(%L != null) {", data.type.name.toArgumentFormat())
    }

    // If its type is already a string, we dont need to call toString
    val setStatement = if (data.type.type.kotlinType() != STRING || data.type.allowedValues?.isNotEmpty() == true) {
        "${data.type.name.toArgumentFormat()}.toString()"
    } else {
        data.type.name.toArgumentFormat()
    }

    addStatement("metadata(%S, %L)", data.type.name.toArgumentFormat(), setStatement)
    if (data.required == false) {
        endControlFlow()
    }

    return this
}
