// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry

import com.intellij.openapi.project.Project
import java.time.Instant
import kotlin.Boolean
import kotlin.Deprecated
import kotlin.Double
import kotlin.Suppress
import software.amazon.awssdk.services.toolkittelemetry.model.Unit
import software.aws.toolkits.core.ConnectionSettings
import software.aws.toolkits.jetbrains.services.telemetry.MetricEventMetadata
import software.aws.toolkits.jetbrains.services.telemetry.TelemetryService

@Deprecated(
    message = "Name conflicts with the Kotlin standard library",
    replaceWith = ReplaceWith("MetricResult", "software.aws.toolkits.telemetry.MetricResult"),
)
public typealias Result = MetricResult

@Deprecated(
    "Use type-safe metric builders",
    ReplaceWith("Telemetry.metadata", "software.aws.toolkits.telemetry.Telemetry"),
)
public object MetadataTelemetry {
    /**
     * It does not actually have a result, yep
     */
    public fun hasResult(
        project: Project?,
        result: MetricResult? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(project) {
            datum("metadata_hasResult") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                if(result != null) {
                    metadata("result", result.toString())
                }
            }
        }
    }

    /**
     * It does not actually have a result, yep
     */
    public fun hasResult(
        connectionSettings: ConnectionSettings? = null,
        result: MetricResult? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(connectionSettings) {
            datum("metadata_hasResult") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                if(result != null) {
                    metadata("result", result.toString())
                }
            }
        }
    }

    /**
     * It does not actually have a result, yep
     */
    public fun hasResult(
        metadata: MetricEventMetadata,
        result: MetricResult? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(metadata) {
            datum("metadata_hasResult") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                if(result != null) {
                    metadata("result", result.toString())
                }
            }
        }
    }

    /**
     * It does not actually have a result, yep
     */
    public fun hasResult(
        project: Project? = null,
        success: Boolean,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        hasResult(project, if(success) MetricResult.Succeeded else MetricResult.Failed, passive, value, createTime)
    }

    /**
     * It does not actually have a result, yep
     */
    public fun hasResult(
        connectionSettings: ConnectionSettings? = null,
        success: Boolean,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        hasResult(connectionSettings, if(success) MetricResult.Succeeded else MetricResult.Failed, passive, value, createTime)
    }

    /**
     * It does not actually have a result, yep
     */
    public fun hasResult(
        metadata: MetricEventMetadata,
        success: Boolean,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        hasResult(metadata, if(success) MetricResult.Succeeded else MetricResult.Failed, passive, value, createTime)
    }
}
