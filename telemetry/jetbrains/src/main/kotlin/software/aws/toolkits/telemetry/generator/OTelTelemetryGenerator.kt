// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import com.squareup.kotlinpoet.BOOLEAN
import com.squareup.kotlinpoet.ClassName
import com.squareup.kotlinpoet.CodeBlock
import com.squareup.kotlinpoet.FileSpec
import com.squareup.kotlinpoet.FunSpec
import com.squareup.kotlinpoet.KModifier
import com.squareup.kotlinpoet.ParameterizedTypeName.Companion.parameterizedBy
import com.squareup.kotlinpoet.PropertySpec
import com.squareup.kotlinpoet.STRING
import com.squareup.kotlinpoet.TypeName
import com.squareup.kotlinpoet.TypeSpec
import com.squareup.kotlinpoet.TypeVariableName
import java.io.File

object OTelTelemetryGenerator {
    private const val PACKAGE_NAME_IMPL = "software.aws.toolkits.telemetry.impl"

    private val OTEL_CONTEXT = ClassName("io.opentelemetry.context", "Context")
    private val OTEL_TRACER = ClassName("io.opentelemetry.api.trace", "Tracer")
    private val OTEL_SPAN_BUILDER = ClassName("io.opentelemetry.api.trace", "SpanBuilder")
    private val OTEL_SPAN = ClassName("io.opentelemetry.api.trace", "Span")
    private val OTEL_RW_SPAN = ClassName("io.opentelemetry.sdk.trace", "ReadWriteSpan")

    private const val TOOLKIT_OTEL_PACKAGE = "software.aws.toolkits.jetbrains.services.telemetry.otel"
    private val TOOLKIT_ABSTRACT_BASE_SPAN = ClassName(TOOLKIT_OTEL_PACKAGE, "AbstractBaseSpan")
    private val TOOLKIT_ABSTRACT_SPAN_BUILDER = ClassName(TOOLKIT_OTEL_PACKAGE, "AbstractSpanBuilder")
    private val TOOLKIT_DEFAULT_SPAN_BUILDER = ClassName(TOOLKIT_OTEL_PACKAGE, "DefaultSpanBuilder")
    private val TOOLKIT_OTEL_SERVICE = ClassName(TOOLKIT_OTEL_PACKAGE, "OTelService")

    private val SPAN_TYPE_TYPEVAR = TypeVariableName("SpanType")

    private val GENERATED_BASE_SPAN = ClassName(PACKAGE_NAME_IMPL, "BaseSpan")

    private val indent = " ".repeat(4)
    private val commonMetadataTypes =
        setOf(
            "duration",
            "httpStatusCode",
            "reason",
            "reasonDesc",
            "requestId",
            "requestServiceType",
            "result",
            // handled by OpenTelemetry emitter
//            "traceId",
//            "metricId",
//            "parentId",
            // handled as special cases in base
//            "passive",
//            "value",
//            "unit",
        )

    fun generateTelemetryFromFiles(
        inputFiles: List<File>,
        defaultDefinitions: List<String> = ResourceLoader.DEFINITIONS_FILES,
        outputFolder: File,
    ) {
        val telemetryDefinitions = TelemetryParser.parseFiles(defaultDefinitions, inputFiles)

        FileSpec.builder(GENERATED_BASE_SPAN)
            .indent(indent)
            .generateHeader()
            .addType(baseSpan(telemetryDefinitions))
            .build()
            .writeTo(outputFolder)

        val telemetryKt =
            FileSpec.builder(PACKAGE_NAME, "Telemetry")
                .indent(indent)
                .generateHeader()

        val telemetryRootBuilder = TypeSpec.objectBuilder("Telemetry")

        telemetryDefinitions.metrics.groupBy { it.namespace() }
            .toSortedMap()
            .forEach { (namespace, metrics) ->
                generateMetrics(telemetryRootBuilder, outputFolder, namespace, metrics)
            }

        telemetryKt
            .addType(telemetryRootBuilder.build())
            .build()
            .writeTo(outputFolder)
    }

    // public open class BaseSpan<SpanType : BaseSpan<SpanType>>(
    //    context: Context?,
    //    `delegate`: Span,
    // ) : AbstractBaseSpan<SpanType>(context, delegate as ReadWriteSpan) {
    private fun baseSpan(telemetryDefinitions: TelemetrySchema) =
        TypeSpec.classBuilder(GENERATED_BASE_SPAN)
            .addModifiers(KModifier.OPEN)
            .primaryConstructor(
                FunSpec.constructorBuilder()
                    .addParameter("context", OTEL_CONTEXT.copy(nullable = true))
                    .addParameter("delegate", OTEL_SPAN)
                    .build(),
            )
            .addTypeVariable(SPAN_TYPE_TYPEVAR.copy(bounds = listOf(GENERATED_BASE_SPAN.parameterizedBy(SPAN_TYPE_TYPEVAR))))
            .superclass(
                TOOLKIT_ABSTRACT_BASE_SPAN
                    .parameterizedBy(SPAN_TYPE_TYPEVAR),
            )
            .addSuperclassConstructorParameter("context, delegate as %T", OTEL_RW_SPAN)
            .apply {
                commonMetadataTypes.forEach { t ->
                    val type = telemetryDefinitions.types.firstOrNull { it.name == t } ?: return@forEach

                    addFunctions(MetadataSchema(type, false).overloadedFunSpec(SPAN_TYPE_TYPEVAR))
                }

                // special case
                addFunction(
                    FunSpec.builder("success")
                        .addParameter("success", BOOLEAN)
                        .returns(SPAN_TYPE_TYPEVAR)
                        .addStatement("result(if(success) MetricResult.Succeeded else MetricResult.Failed)")
                        .addStatement("return this as %T", SPAN_TYPE_TYPEVAR)
                        .build(),
                )
            }
            .build()

    private fun generateMetrics(
        rootBuilder: TypeSpec.Builder,
        outputFolder: File,
        namespace: String,
        metrics: List<MetricSchema>,
    ) {
        val tracerName = ClassName(PACKAGE_NAME_IMPL, "${namespace.capitalize()}Tracer")

        val tracerKt =
            FileSpec.builder(tracerName)
                .indent(indent)
                .generateHeader()

        // public class AmazonqTracer internal constructor(
        //    private val `delegate`: Tracer,
        // ) : Tracer {
        //    /**
        //     * When user opens CWSPR chat panel
        //     */
        //    public val openChat: AmazonqopenChatSpanBuilder
        //        get() = AmazonqopenChatSpanBuilder(delegate.spanBuilder("amazonq_openChat"))
        val tracer =
            TypeSpec.classBuilder(tracerName)
                .addSuperinterface(OTEL_TRACER)
                .primaryConstructor(
                    FunSpec.constructorBuilder()
                        .addModifiers(KModifier.INTERNAL)
                        .addParameter("delegate", OTEL_TRACER)
                        .build(),
                )
                .addProperty(
                    PropertySpec.builder("delegate", OTEL_TRACER)
                        .initializer("delegate")
                        .addModifiers(KModifier.PRIVATE)
                        .build(),
                )
                .addFunction(
                    FunSpec.builder("spanBuilder")
                        .addModifiers(KModifier.OVERRIDE)
                        .addParameter("spanName", String::class)
                        .returns(TOOLKIT_DEFAULT_SPAN_BUILDER)
                        .addStatement("return %T(delegate.spanBuilder(spanName))", TOOLKIT_DEFAULT_SPAN_BUILDER)
                        .build(),
                )
                .apply {
                    metrics.forEach { metricSchema ->
                        val metricName = metricSchema.name.split("_", limit = 2)[1]
                        val metricSpanName = ClassName(PACKAGE_NAME_IMPL, "${namespace.capitalize()}${metricName}Span")
                        val metricSpanBuilderName = ClassName(PACKAGE_NAME_IMPL, "${namespace.capitalize()}${metricName}SpanBuilder")

                        tracerKt.generateMetricSpan(metricSchema, metricSpanName)
                        tracerKt.generateMetricSpanBuilder(metricSpanName, metricSpanBuilderName)

                        //     /**
                        //     * When user opens CWSPR chat panel
                        //     */
                        //    public val openChat: AmazonqopenChatSpanBuilder
                        //        get() = AmazonqopenChatSpanBuilder(delegate.spanBuilder("amazonq_openChat"))
                        addProperty(
                            PropertySpec.builder(metricName, metricSpanBuilderName)
                                .getter(
                                    FunSpec.builder("get()")
                                        .addStatement("""return %T(delegate.spanBuilder(%S))""", metricSpanBuilderName, metricSchema.name)
                                        .build(),
                                )
                                .addKdoc(metricSchema.description)
                                .build(),
                        )
                    }
                }
                .build()

        tracerKt
            .addType(tracer)
            .build()
            .writeTo(outputFolder)

        rootBuilder.addProperty(
            PropertySpec.builder(namespace, tracerName)
                .getter(
                    FunSpec.builder("get()")
                        .addStatement("return %T(%T.getSdk().getTracer(%S))", tracerName, TOOLKIT_OTEL_SERVICE, namespace)
                        .build(),
                )
                .build(),
        )
    }

    private fun FileSpec.Builder.generateMetricSpanBuilder(
        metricSpanName: ClassName,
        metricSpanBuilderName: ClassName,
    ) {
        // public class AmazonqopenChatSpanBuilder internal constructor(
        //    `delegate`: SpanBuilder,
        // ) : AbstractSpanBuilder<AmazonqopenChatSpanBuilder, AmazonqopenChatSpan>(delegate) {
        //    override fun doStartSpan(): AmazonqopenChatSpan = AmazonqopenChatSpan(parent, delegate.startSpan())
        // }
        val metricSpanBuilder =
            TypeSpec.classBuilder(metricSpanBuilderName)
                .primaryConstructor(
                    FunSpec.constructorBuilder()
                        .addModifiers(KModifier.INTERNAL)
                        .addParameter("delegate", OTEL_SPAN_BUILDER)
                        .build(),
                )
                .superclass(
                    TOOLKIT_ABSTRACT_SPAN_BUILDER.parameterizedBy(metricSpanBuilderName, metricSpanName),
                )
                .addSuperclassConstructorParameter("delegate")
                .addFunction(
                    FunSpec.builder("doStartSpan")
                        .returns(metricSpanName)
                        .addModifiers(KModifier.OVERRIDE)
                        .addStatement("return %T(parent, delegate.startSpan())", metricSpanName)
                        .build(),
                )
                .build()
        addType(metricSpanBuilder)
    }

    private fun FileSpec.Builder.generateMetricSpan(
        metricSchema: MetricSchema,
        metricSpanName: ClassName,
    ) {
        // public class AmazonqopenChatSpan internal constructor(
        //    context: Context?,
        //    span: Span,
        // ) : BaseSpan<AmazonqopenChatSpan>(context, span) {
        //    init {
        //        passive(false)
        //    }
        //
        //    override val requiredFields: Collection<String> = setOf()
        // }
        val metricSpan =
            TypeSpec.classBuilder(metricSpanName)
                .primaryConstructor(
                    FunSpec.constructorBuilder()
                        .addModifiers(KModifier.INTERNAL)
                        .addParameter("context", OTEL_CONTEXT.copy(nullable = true))
                        .addParameter("span", OTEL_SPAN)
                        .build(),
                )
                .addKdoc(metricSchema.description)
                .superclass(GENERATED_BASE_SPAN.parameterizedBy(metricSpanName))
                .addSuperclassConstructorParameter("context, span")
                .apply {
                    if (!metricSchema.passive) {
                        addInitializerBlock(CodeBlock.builder().addStatement("passive(false)").build())
                    }

                    metricSchema.metadata.filterNot { it.type.name in commonMetadataTypes }.forEach { metadata ->
                        addFunctions(metadata.overloadedFunSpec(metricSpanName))
                    }

                    val requiredAttributes = metricSchema.metadata.filter { it.required != false }
                    addProperty(
                        PropertySpec.builder("requiredFields", Collection::class.parameterizedBy(String::class), KModifier.OVERRIDE)
                            .initializer(
                                """setOf(${ "%S,".repeat(requiredAttributes.size) })""",
                                *requiredAttributes.map { it.type.name }.toTypedArray(),
                            )
                            .build(),
                    )
                }
                .build()
        addType(metricSpan)
    }

    private fun MetadataSchema.overloadedFunSpec(returnType: TypeName): List<FunSpec> {
        val types =
            if (type.allowedValues?.isNotEmpty() == true) {
                listOf(ClassName(PACKAGE_NAME, type.typeName))
            } else {
                type.type.kotlinTypes()
            }

        return types.map { t ->
            val needsToString = (t != STRING || type.allowedValues?.isNotEmpty() == true)
            val nullable = required == false

            FunSpec.builder(type.name)
                .addParameter(type.name, t.copy(nullable = nullable))
                .returns(returnType)
                .apply {
                    val valueParam =
                        if (needsToString) {
                            if (nullable) {
                                "%N?.let { it.toString() }"
                            } else {
                                "%N.toString()"
                            }
                        } else {
                            "%N"
                        }

                    addStatement("return metadata(%S, $valueParam)", type.name, type.name)
                }
                .addKdoc(type.description)
                .build()
        }
    }
}
