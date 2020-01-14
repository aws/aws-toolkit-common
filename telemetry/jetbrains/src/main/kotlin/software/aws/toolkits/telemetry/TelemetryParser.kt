// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry

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
        override fun getTypeFromType(): TypeName = com.squareup.kotlinpoet.STRING
    },
    INT("int") {
        override fun getTypeFromType(): TypeName = com.squareup.kotlinpoet.INT
    },
    DOUBLE("double") {
        override fun getTypeFromType(): TypeName = com.squareup.kotlinpoet.DOUBLE
    },
    BOOLEAN("boolean") {
        override fun getTypeFromType(): TypeName = com.squareup.kotlinpoet.BOOLEAN
    };

    abstract fun getTypeFromType(): TypeName
}

data class TelemetryMetricType(
    val name: String,
    val description: String,
    val type: MetricMetadataTypes?,
    val allowedValues: List<Any>?
)

data class MetricType(val telemetryMetricType: TelemetryMetricType, val require: Boolean)

enum class MetricUnit(@get:JsonValue val type: String) {
    NONE("None"),
    MILLISECONDS("Milliseconds"),
    BYTES("Bytes"),
    PERCENT("Percent"),
    COUNT("Count")
}

data class Metadata(
    val type: String,
    val required: Boolean?
)

data class Metric(
    val name: String,
    val description: String,
    val unit: MetricUnit?,
    val metadata: List<Metadata>?
)

data class TelemetryDefinition(
    val types: List<TelemetryMetricType>?,
    val metrics: List<Metric>
)

object TelemetryParser {
    fun parseFiles(
        paths: List<File> = listOf(),
        defaultResourcesFile: String
    ): TelemetryDefinition {
        val files = paths.map { it.readText() }.plus(defaultResourcesFile)
        val rawSchema = JSONObject(JSONTokener(ResourceLoader.SCHEMA_FILE))
        val schema: Schema = SchemaLoader.load(rawSchema)
        files.forEach { validate(it, schema) }
        return parse(files)
    }

    private fun validate(fileContents: String, schema: Schema) {
        try {
            schema.validate(JSONObject(fileContents))
        } catch (e: Exception) {
            System.err.println("Schema validation failed due to thrown exception $e")
            throw e
        }
    }

    private fun parse(input: List<String>): TelemetryDefinition =
        // TODO validate schema using json schema
        input.map {
            try {
                val mapper = jacksonObjectMapper()
                return@map mapper.readValue<TelemetryDefinition>(it)
            } catch (e: Exception) {
                System.err.println("Error while parsing: $e")
                throw e
            }
        }.fold(TelemetryDefinition(listOf(), listOf())) { it, it2 ->
            TelemetryDefinition(
                it.types!!.plus(it2.types ?: listOf()),
                it.metrics.plus(it2.metrics)
            )
        }
}
