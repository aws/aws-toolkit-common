// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import com.fasterxml.jackson.annotation.JsonValue
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
import com.squareup.kotlinpoet.TypeName
import org.everit.json.schema.Schema
import org.everit.json.schema.loader.SchemaLoader
import org.json.JSONObject
import org.json.JSONTokener
import java.io.File

enum class MetricMetadataTypes(@get:JsonValue val type: String) {
    STRING("string") {
        override fun kotlinType(): TypeName = com.squareup.kotlinpoet.STRING
    },
    INT("int") {
        override fun kotlinType(): TypeName = com.squareup.kotlinpoet.INT
    },
    DOUBLE("double") {
        override fun kotlinType(): TypeName = com.squareup.kotlinpoet.DOUBLE
    },
    BOOLEAN("boolean") {
        override fun kotlinType(): TypeName = com.squareup.kotlinpoet.BOOLEAN
    };

    abstract fun kotlinType(): TypeName
}

data class TelemetryMetricType(
    val name: String,
    val description: String,
    val type: MetricMetadataTypes = MetricMetadataTypes.STRING,
    val allowedValues: List<Any>?
)

enum class MetricUnit(@get:JsonValue val type: String) {
    NONE("None"),
    MILLISECONDS("Milliseconds"),
    BYTES("Bytes"),
    PERCENT("Percent"),
    COUNT("Count")
}

private data class MetadataDefinition(
    val type: String,
    val required: Boolean?
)

private data class MetricDefinition(
    val name: String,
    val description: String,
    val unit: MetricUnit?,
    val metadata: List<MetadataDefinition> = listOf(),
    val passive: Boolean = false
)

private data class TelemetryDefinition(
    val types: List<TelemetryMetricType> = listOf(),
    val metrics: List<MetricDefinition>
)

data class TelemetrySchema(
    val types: List<TelemetryMetricType>,
    val metrics: List<MetricSchema>
)

data class MetricSchema(
    val name: String,
    val description: String,
    val unit: MetricUnit?,
    val metadata: List<MetadataSchema>,
    val passive: Boolean = false
)

fun MetricSchema.namespace() = name.split('_').first().toLowerCase()

data class MetadataSchema(
    val type: TelemetryMetricType,
    val required: Boolean?
)

object TelemetryParser {
    private val MAPPER = jacksonObjectMapper()

    /**
     * Read in default definitions and extra definitions files, and deserialize into an object
     *
     * Definitions from `paths` will override definitions from defaultResourceFiles if their names
     * are the same. This allows testing updates to existing definitions from within each IDE project.
     */
    fun parseFiles(
        defaultResourcesFiles: List<String>,
        paths: List<File> = listOf()
    ): TelemetrySchema {
        val files = paths.map { it.readText() } + defaultResourcesFiles
        val rawSchema = JSONObject(JSONTokener(ResourceLoader.SCHEMA_FILE))
        val schema: Schema = SchemaLoader.load(rawSchema)
        files.forEach { validate(it, schema) }

        val telemetryDefinition = files.map { parse(it) }.fold(TelemetryDefinition(listOf(), listOf())) { it, it2 ->
            TelemetryDefinition(
                it.types.plus(it2.types),
                it.metrics.plus(it2.metrics)
            )
        }.let {
            TelemetryDefinition(
                it.types.distinctBy{ t -> t.name},
                it.metrics.distinctBy { m -> m.name }
            )
        }

        val metadataTypes = telemetryDefinition.types.associateBy { it.name }

        val resolvedMetricTypes = telemetryDefinition.metrics.map {
            MetricSchema(
                it.name,
                it.description,
                it.unit,
                it.metadata.map { metadata -> MetadataSchema(metadataTypes.getValue(metadata.type), metadata.required) },
                it.passive
            )
        }

        return TelemetrySchema(
            telemetryDefinition.types,
            resolvedMetricTypes
        )
    }

    private fun validate(fileContents: String, schema: Schema) {
        try {
            schema.validate(JSONObject(fileContents))
        } catch (e: Exception) {
            System.err.println("Schema validation failed due to thrown exception $e\non input:\n$fileContents")
            throw e
        }
    }

    private fun parse(input: String): TelemetryDefinition =
        try {
            MAPPER.readValue(input)
        } catch (e: Exception) {
            System.err.println("Error while parsing: $e")
            throw e
        }
}
