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
import kotlin.String
import kotlin.Suppress
import software.amazon.awssdk.services.toolkittelemetry.model.MetricUnit
import software.aws.toolkits.core.ConnectionSettings
import software.aws.toolkits.jetbrains.services.telemetry.MetricEventMetadata
import software.aws.toolkits.jetbrains.services.telemetry.TelemetryService

@Deprecated(
    "Use type-safe metric builders",
    ReplaceWith("Telemetry.test", "software.aws.toolkits.telemetry.Telemetry"),
)
public object TestTelemetry {
    /**
     * Testing metric with global metadata fields
     */
    public fun metric(
        project: Project?,
        duration: Double? = null,
        httpStatusCode: String? = null,
        reason: String? = null,
        reasonDesc: String? = null,
        requestId: String? = null,
        requestServiceType: String? = null,
        result: MetricResult? = null,
        traceId: String? = null,
        metricId: String? = null,
        parentId: String? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(project) {
            datum("test_metric") {
                createTime(createTime)
                unit(MetricUnit.NONE)
                value(value)
                passive(passive)
                if(duration != null) {
                    metadata("duration", duration.toString())
                }
                if(httpStatusCode != null) {
                    metadata("httpStatusCode", httpStatusCode)
                }
                if(reason != null) {
                    metadata("reason", reason)
                }
                if(reasonDesc != null) {
                    metadata("reasonDesc", reasonDesc)
                }
                if(requestId != null) {
                    metadata("requestId", requestId)
                }
                if(requestServiceType != null) {
                    metadata("requestServiceType", requestServiceType)
                }
                if(result != null) {
                    metadata("result", result.toString())
                }
                if(traceId != null) {
                    metadata("traceId", traceId)
                }
                if(metricId != null) {
                    metadata("metricId", metricId)
                }
                if(parentId != null) {
                    metadata("parentId", parentId)
                }
            }
        }
    }

    /**
     * Testing metric with global metadata fields
     */
    public fun metric(
        connectionSettings: ConnectionSettings? = null,
        duration: Double? = null,
        httpStatusCode: String? = null,
        reason: String? = null,
        reasonDesc: String? = null,
        requestId: String? = null,
        requestServiceType: String? = null,
        result: MetricResult? = null,
        traceId: String? = null,
        metricId: String? = null,
        parentId: String? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(connectionSettings) {
            datum("test_metric") {
                createTime(createTime)
                unit(MetricUnit.NONE)
                value(value)
                passive(passive)
                if(duration != null) {
                    metadata("duration", duration.toString())
                }
                if(httpStatusCode != null) {
                    metadata("httpStatusCode", httpStatusCode)
                }
                if(reason != null) {
                    metadata("reason", reason)
                }
                if(reasonDesc != null) {
                    metadata("reasonDesc", reasonDesc)
                }
                if(requestId != null) {
                    metadata("requestId", requestId)
                }
                if(requestServiceType != null) {
                    metadata("requestServiceType", requestServiceType)
                }
                if(result != null) {
                    metadata("result", result.toString())
                }
                if(traceId != null) {
                    metadata("traceId", traceId)
                }
                if(metricId != null) {
                    metadata("metricId", metricId)
                }
                if(parentId != null) {
                    metadata("parentId", parentId)
                }
            }
        }
    }

    /**
     * Testing metric with global metadata fields
     */
    public fun metric(
        metadata: MetricEventMetadata,
        duration: Double? = null,
        httpStatusCode: String? = null,
        reason: String? = null,
        reasonDesc: String? = null,
        requestId: String? = null,
        requestServiceType: String? = null,
        result: MetricResult? = null,
        traceId: String? = null,
        metricId: String? = null,
        parentId: String? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(metadata) {
            datum("test_metric") {
                createTime(createTime)
                unit(MetricUnit.NONE)
                value(value)
                passive(passive)
                if(duration != null) {
                    metadata("duration", duration.toString())
                }
                if(httpStatusCode != null) {
                    metadata("httpStatusCode", httpStatusCode)
                }
                if(reason != null) {
                    metadata("reason", reason)
                }
                if(reasonDesc != null) {
                    metadata("reasonDesc", reasonDesc)
                }
                if(requestId != null) {
                    metadata("requestId", requestId)
                }
                if(requestServiceType != null) {
                    metadata("requestServiceType", requestServiceType)
                }
                if(result != null) {
                    metadata("result", result.toString())
                }
                if(traceId != null) {
                    metadata("traceId", traceId)
                }
                if(metricId != null) {
                    metadata("metricId", metricId)
                }
                if(parentId != null) {
                    metadata("parentId", parentId)
                }
            }
        }
    }

    /**
     * Testing metric with global metadata fields
     */
    public fun metric(
        project: Project? = null,
        duration: Double? = null,
        httpStatusCode: String? = null,
        reason: String? = null,
        reasonDesc: String? = null,
        requestId: String? = null,
        requestServiceType: String? = null,
        success: Boolean,
        traceId: String? = null,
        metricId: String? = null,
        parentId: String? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        metric(project, duration, httpStatusCode, reason, reasonDesc, requestId, requestServiceType, if(success) MetricResult.Succeeded else MetricResult.Failed, traceId, metricId, parentId, passive, value, createTime)
    }

    /**
     * Testing metric with global metadata fields
     */
    public fun metric(
        connectionSettings: ConnectionSettings? = null,
        duration: Double? = null,
        httpStatusCode: String? = null,
        reason: String? = null,
        reasonDesc: String? = null,
        requestId: String? = null,
        requestServiceType: String? = null,
        success: Boolean,
        traceId: String? = null,
        metricId: String? = null,
        parentId: String? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        metric(connectionSettings, duration, httpStatusCode, reason, reasonDesc, requestId, requestServiceType, if(success) MetricResult.Succeeded else MetricResult.Failed, traceId, metricId, parentId, passive, value, createTime)
    }

    /**
     * Testing metric with global metadata fields
     */
    public fun metric(
        metadata: MetricEventMetadata,
        duration: Double? = null,
        httpStatusCode: String? = null,
        reason: String? = null,
        reasonDesc: String? = null,
        requestId: String? = null,
        requestServiceType: String? = null,
        success: Boolean,
        traceId: String? = null,
        metricId: String? = null,
        parentId: String? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        metric(metadata, duration, httpStatusCode, reason, reasonDesc, requestId, requestServiceType, if(success) MetricResult.Succeeded else MetricResult.Failed, traceId, metricId, parentId, passive, value, createTime)
    }
}
