// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import com.squareup.kotlinpoet.AnnotationSpec
import com.squareup.kotlinpoet.BOOLEAN
import com.squareup.kotlinpoet.ClassName
import com.squareup.kotlinpoet.DOUBLE
import com.squareup.kotlinpoet.FileSpec
import com.squareup.kotlinpoet.FunSpec
import com.squareup.kotlinpoet.KModifier
import com.squareup.kotlinpoet.ParameterSpec
import com.squareup.kotlinpoet.PropertySpec
import com.squareup.kotlinpoet.STRING
import com.squareup.kotlinpoet.TypeAliasSpec
import com.squareup.kotlinpoet.TypeSpec
import com.squareup.kotlinpoet.TypeVariableName
import java.io.File
import java.time.Instant

const val PACKAGE_NAME = "software.aws.toolkits.telemetry"

const val JETBRAINS_TELEMETRY_PACKAGE_NAME = "software.aws.toolkits.jetbrains.services.telemetry"
val METRIC_METADATA = ClassName(JETBRAINS_TELEMETRY_PACKAGE_NAME, "MetricEventMetadata")
val TELEMETRY_SERVICE = ClassName(JETBRAINS_TELEMETRY_PACKAGE_NAME, "TelemetryService")
val PROJECT = ClassName("com.intellij.openapi.project", "Project").copy(nullable = true)
val CONNECTION_SETTINGS = ClassName("software.aws.toolkits.core", "ConnectionSettings").copy(nullable = true)
val METRIC_UNIT = ClassName("software.amazon.awssdk.services.toolkittelemetry.model", "MetricUnit")

const val RESULT = "result"
const val SUCCESS = "success"
const val SANITIZED_RESULT_TYPE_FORMAT = "MetricResult"

fun String.filterInvalidCharacters() = this.replace(".", "")

fun String.toTypeFormat() = this.filterInvalidCharacters().split("_", "-").joinToString(separator = "") { it.capitalize() }

fun String.toArgumentFormat() = this.toTypeFormat().decapitalize()

fun generateTelemetryFromFiles(
    inputFiles: List<File>,
    defaultDefinitions: List<String> = ResourceLoader.DEFINITIONS_FILES,
    outputFolder: File,
) {
    val telemetry = TelemetryParser.parseFiles(defaultDefinitions, inputFiles)
    val commonMetadataTypes =
        setOf(
            "duration",
            "httpStatusCode",
            "reason",
            "reasonDesc",
            "requestId",
            "requestServiceType",
            "result",
            "traceId",
            "metricId",
            "parentId",
        )

    val metricsWithCommonMetadata =
        telemetry.metrics.map { metric ->
            // compute [MetadataSchema] for any common types not already declared in the schema
            val commonMetadata =
                commonMetadataTypes.mapNotNull { commonMetadataType ->
                    val type = telemetry.types.firstOrNull { it.name == commonMetadataType }

                    if (type != null && metric.metadata.none { it.type.name == commonMetadataType }) {
                        MetadataSchema(type, false)
                    } else {
                        null
                    }
                }

            // metadata will be sorted during generation
            metric.copy(metadata = metric.metadata + commonMetadata)
        }

    val indent = " ".repeat(4)
    // make sure the output directory exists before writing to it
    outputFolder.mkdirs()
    FileSpec.builder(PACKAGE_NAME, "TelemetryEnums")
        .indent(indent)
        .generateHeader()
        .generateTelemetryEnumTypes(telemetry.types)
        .generateDeprecatedOverloads(RESULT)
        .build()
        .writeTo(outputFolder)

    // Namespaced metrics
    metricsWithCommonMetadata.groupBy { it.namespace() }
        .toSortedMap()
        .forEach { (namespace, metrics) ->
            FileSpec.builder(PACKAGE_NAME, namespace.capitalize() + "Telemetry")
                .indent(indent)
                .generateHeader()
                .generateNamespaces(namespace, metrics)
                .build()
                .writeTo(outputFolder)
        }
}

internal fun FileSpec.Builder.generateHeader(): FileSpec.Builder {
    addFileComment("Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.\n")
    addFileComment("SPDX-License-Identifier: Apache-2.0\n")
    addFileComment("THIS FILE IS GENERATED! DO NOT EDIT BY HAND!")
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
    val typeName = item.typeName
    val enum =
        TypeSpec.enumBuilder(typeName)
            .primaryConstructor(
                FunSpec.constructorBuilder()
                    .addParameter("value", String::class)
                    .build(),
            )
            .addProperty(PropertySpec.builder("value", String::class, KModifier.PRIVATE).initializer("value").build())
            .addFunction(FunSpec.builder("toString").addModifiers(KModifier.OVERRIDE).returns(String::class).addStatement("return value").build())
            .addKdoc(item.description)

    item.allowedValues!!.forEach { enumValue ->
        enum.addEnumConstant(
            enumValue.toString().replace(Regex("\\s"), "_").toTypeFormat(),
            TypeSpec.anonymousClassBuilder()
                .addSuperclassConstructorParameter("%S", enumValue.toString())
                .build(),
        )
    }

    // Add an unknown value
    val unknownType = "unknown".toTypeFormat()

    enum.addEnumConstant(
        unknownType,
        TypeSpec.anonymousClassBuilder()
            .addSuperclassConstructorParameter("%S", "unknown")
            .build(),
    ).build()

    val companion =
        TypeSpec.companionObjectBuilder()
            .addFunction(
                FunSpec.builder("from")
                    .returns(ClassName("", typeName))
                    .addParameter("type", String::class)
                    .addStatement("return values().firstOrNull·{·it.value·==·type·} ?:·$unknownType")
                    .build(),
            )
            .build()

    enum.addType(companion)

    addType(enum.build())

    return this
}

private fun FileSpec.Builder.generateDeprecatedOverloads(name: String): FileSpec.Builder {
    val oldName = name.toTypeFormat()
    val replacementType = TypeVariableName("Metric$oldName")
    val replacementFqn = TypeVariableName("$PACKAGE_NAME.$replacementType")
    val alias =
        TypeAliasSpec.builder(oldName, replacementType)
            .addAnnotation(
                AnnotationSpec.builder(Deprecated::class)
                    .addMember("message = %S", "Name conflicts with the Kotlin standard library")
                    .addMember("replaceWith = ReplaceWith(%S, %S)", replacementType, replacementFqn)
                    .build(),
            )
            .build()

    addTypeAlias(alias)

    return this
}

private fun FileSpec.Builder.generateNamespaces(
    namespace: String,
    metrics: List<MetricSchema>,
): FileSpec.Builder {
    val telemetryObject =
        TypeSpec.objectBuilder("${namespace.toTypeFormat()}Telemetry")
            .addAnnotation(
                AnnotationSpec.builder(Deprecated::class)
                    .addMember(""""Use type-safe metric builders"""")
                    .addMember("""ReplaceWith("Telemetry.$namespace", "software.aws.toolkits.telemetry.Telemetry")""")
                    .build(),
            )
    metrics.sortedBy { it.name }.forEach {
        telemetryObject.generateRecordFunctions(it)
    }

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

fun buildProjectFunction(
    functionName: String,
    metric: MetricSchema,
): FunSpec {
    val metadataProvider = ParameterSpec.builder("project", PROJECT).build()

    return buildRecordFunction(metadataProvider, functionName, metric)
}

fun buildConnectionSettingsFunction(
    functionName: String,
    metric: MetricSchema,
): FunSpec {
    val metadataProvider = ParameterSpec.builder("connectionSettings", CONNECTION_SETTINGS).defaultValue("null").build()

    return buildRecordFunction(metadataProvider, functionName, metric)
}

fun buildMetricMetadataFunction(
    functionName: String,
    metric: MetricSchema,
): FunSpec {
    val metadataProvider = ParameterSpec.builder("metadata", METRIC_METADATA).build()

    return buildRecordFunction(metadataProvider, functionName, metric)
}

private fun buildRecordFunction(
    metadataProvider: ParameterSpec,
    functionName: String,
    metric: MetricSchema,
): FunSpec {
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
    val typeName =
        if (type.allowedValues != null) {
            ClassName(PACKAGE_NAME, type.name.toTypeFormat().replace("Result", SANITIZED_RESULT_TYPE_FORMAT))
        } else {
            type.type.kotlinType()
        }.copy(nullable = required == false)

    val parameterSpec = ParameterSpec.builder(type.name.toArgumentFormat(), typeName)
    if (required == false) {
        parameterSpec.defaultValue("null")
    }
    return parameterSpec.build()
}

private fun FunSpec.Builder.generateFunctionBody(
    metadataParameter: ParameterSpec,
    metric: MetricSchema,
): FunSpec.Builder {
    beginControlFlow("%T.getInstance().record(${metadataParameter.name})", TELEMETRY_SERVICE)
    beginControlFlow("datum(%S)", metric.name)
    addStatement("createTime(createTime)")
    addStatement("unit(%T.${(metric.unit ?: MetricUnit.NONE).name})", METRIC_UNIT)
    addStatement("value(value)")
    addStatement("passive(passive)")
    metric.metadata.forEach {
        generateMetadataStatement(it)
    }
    endControlFlow()
    endControlFlow()

    return this
}

fun buildProjectOverloadFunction(
    functionName: String,
    metric: MetricSchema,
): FunSpec {
    val metadataProvider = ParameterSpec.builder("project", PROJECT).defaultValue("null").build()

    return buildResultOverloadFunction(metadataProvider, functionName, metric)
}

fun buildConnectionSettingsOverloadFunction(
    functionName: String,
    metric: MetricSchema,
): FunSpec {
    val metadataProvider = ParameterSpec.builder("connectionSettings", CONNECTION_SETTINGS).defaultValue("null").build()
    return buildResultOverloadFunction(metadataProvider, functionName, metric)
}

fun buildMetricMetadataOverloadFunction(
    functionName: String,
    metric: MetricSchema,
): FunSpec {
    val metadataProvider = ParameterSpec.builder("metadata", METRIC_METADATA).build()

    return buildResultOverloadFunction(metadataProvider, functionName, metric)
}

fun buildResultOverloadFunction(
    metadataProvider: ParameterSpec,
    functionName: String,
    metric: MetricSchema,
): FunSpec {
    val overloadedParameters =
        buildMetricParameters(metric).map {
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

private fun FunSpec.Builder.generateResultOverloadFunctionBody(
    functionName: String,
    parameters: List<ParameterSpec>,
): FunSpec.Builder {
    addStatement(
        "%L(%L)",
        functionName,
        parameters.joinToString {
            if (it.name != SUCCESS) {
                it.name
            } else {
                "if($SUCCESS) $SANITIZED_RESULT_TYPE_FORMAT.Succeeded else $SANITIZED_RESULT_TYPE_FORMAT.Failed"
            }
        },
    )

    return this
}

private fun FunSpec.Builder.generateMetadataStatement(data: MetadataSchema): FunSpec.Builder {
    if (data.required == false) {
        beginControlFlow("if(%L != null) {", data.type.name.toArgumentFormat())
    }

    // If its type is already a string, we dont need to call toString
    val setStatement =
        if (data.type.type.kotlinType() != STRING || data.type.allowedValues?.isNotEmpty() == true) {
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
