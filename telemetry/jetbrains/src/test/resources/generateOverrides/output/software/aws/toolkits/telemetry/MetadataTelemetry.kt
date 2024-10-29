// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry

import com.intellij.openapi.project.Project
import java.time.Instant
import kotlin.Boolean
import kotlin.Double
import kotlin.Suppress
import software.amazon.awssdk.services.toolkittelemetry.model.Unit
import software.aws.toolkits.core.ConnectionSettings
import software.aws.toolkits.jetbrains.services.telemetry.MetricEventMetadata
import software.aws.toolkits.jetbrains.services.telemetry.TelemetryService

public object MetadataTelemetry {
    /**
     * It does not actually have a result, yep
     */
    public fun hasResult(
        project: Project?,
        result: Result? = null,
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
        result: Result? = null,
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
        result: Result? = null,
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
        hasResult(project, if(success) Result.Succeeded else Result.Failed, passive, value,
                createTime)
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
        hasResult(connectionSettings, if(success) Result.Succeeded else Result.Failed, passive,
                value, createTime)
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
        hasResult(metadata, if(success) Result.Succeeded else Result.Failed, passive, value,
                createTime)
    }
}
