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
import java.time.Instant

fun FileSpec.Builder.generateHeader(): FileSpec.Builder {
    addComment("Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.\n")
    addComment("SPDX-License-Identifier: Apache-2.0\n")
    addComment("THIS FILE IS GENERATED! DO NOT EDIT BY HAND!")

    return this
}

fun FileSpec.Builder.generateTelemetryEnumTypes(items: List<TelemetryMetricType>?): FileSpec.Builder {
    items?.forEach {
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

    addType(enum.build())

    return this
}

fun FileSpec.Builder.generateTelemetryObjects(item: TelemetryDefinition): FileSpec.Builder {
    item
        .metrics
        .sortedBy { it.name }
        .groupBy { it.name.split("_").first().toLowerCase() }
        .forEach { metrics: Map.Entry<String, List<Metric>> -> generateNamespaces(item.types!!, metrics.key, metrics.value) }

    return this
}

private fun FileSpec.Builder.generateNamespaces(types: List<TelemetryMetricType>, namespaceType: String, metrics: List<Metric>): FileSpec.Builder {
    val namespace = TypeSpec.objectBuilder("${namespaceType.toTypeFormat()}Telemetry")
    metrics.forEach { namespace.generateRecordFunctions(it, types) }
    addType(namespace.build())

    return this
}

private fun TypeSpec.Builder.generateRecordFunctions(metric: Metric, types: List<TelemetryMetricType>): TypeSpec.Builder {
    // metric.name.split("_")[1] is guaranteed to work at this point because the schema requires the metric name to have at least 1 underscore
    val functionName = metric.name.split("_")[1]
    val parameters = buildParameters(metric, types)
    val functionBuilder = FunSpec.builder(functionName)
    functionBuilder
        .addParameters(parameters)
        .generateFunctionBody(metric)
        .addKdoc(metric.description)

    val function = functionBuilder.build()
    addFunction(function)
    // Result is special cased to generate a function that accepts true/false instead of a Result
    if (metric.metadata?.any { it.type == RESULT } != true) {
        return this
    }
    val resultFunction = FunSpec.builder(functionName)
    val resultParameters = parameters.map {
        if (it.name == RESULT) {
            ParameterSpec.builder(SUCCESS, BOOLEAN).build()
        } else {
            it
        }
    }
    resultFunction
        .addParameters(resultParameters)
        .generateResultOverloadFunctionBody(function, resultParameters)
        .addKdoc(metric.description)
    addFunction(resultFunction.build())

    return this
}

private fun buildParameters(metric: Metric, types: List<TelemetryMetricType>): List<ParameterSpec> {
    val projectParameter = ClassName("com.intellij.openapi.project", "Project").copy(nullable = true)
    val list = mutableListOf<ParameterSpec>()
    list.add(ParameterSpec.builder("project", projectParameter).defaultValue("null").build())
    list.addAll(metric.metadata?.map { metadata -> metadata.metadataToParameter(types) } ?: listOf())
    list.add(ParameterSpec.builder("value", DOUBLE).defaultValue("1.0").build())
    list.add(ParameterSpec.builder("createTime", Instant::class).defaultValue("Instant.now()").build())
    return list
}

private fun Metadata.metadataToParameter(types: List<TelemetryMetricType>): ParameterSpec {
    val telemetryMetricType = types.find { it.name == type } ?: throw IllegalStateException("Type $type not found in types!")

    val typeName = if (telemetryMetricType.allowedValues != null) {
        ClassName(PACKAGE_NAME, telemetryMetricType.name.toTypeFormat())
    } else {
        telemetryMetricType.type?.getTypeFromType() ?: com.squareup.kotlinpoet.STRING
    }.copy(nullable = required == false)

    val parameterSpec = ParameterSpec.builder(telemetryMetricType.name.toArgumentFormat(), typeName)
    if (required == false) {
        parameterSpec.defaultValue("null")
    }
    return parameterSpec.build()
}

private fun FunSpec.Builder.generateFunctionBody(metric: Metric): FunSpec.Builder {
    val telemetryClient = MemberName("software.aws.toolkits.jetbrains.services.telemetry", "TelemetryService")
    val metricUnit = MemberName("software.amazon.awssdk.services.toolkittelemetry.model", "Unit")
    addStatement("%M.getInstance().record(project) { ", telemetryClient)
    addStatement("datum(%S) {", metric.name)
    addStatement("createTime(createTime)")
    addStatement("unit(%M.${(metric.unit ?: MetricUnit.NONE).name})", metricUnit)
    addStatement("value(value)")
    metric.metadata?.forEach {
        generateMetadataStatement(it, "${it.type.toArgumentFormat()}.toString()")
    }
    addStatement("}}")

    return this
}

private fun FunSpec.Builder.generateResultOverloadFunctionBody(originalFunction: FunSpec, parameters: List<ParameterSpec>): FunSpec.Builder {
    addStatement("%L(%L)", originalFunction.name, parameters.joinToString {
        if (it.name != SUCCESS) {
            it.name
        } else {
            "if(${SUCCESS}) Result.SUCCEEDED else Result.FAILED"
        }
    })

    return this
}

private fun FunSpec.Builder.generateMetadataStatement(data: Metadata, setStatement: String): FunSpec.Builder {
    if (data.required == false) {
        beginControlFlow("if(%L != null) {", data.type.toArgumentFormat())
    }
    addStatement("metadata(%S, %L)", data.type.toArgumentFormat(), setStatement)
    if (data.required == false) {
        endControlFlow()
    }

    return this
}
