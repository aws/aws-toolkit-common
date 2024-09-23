// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry

import com.intellij.openapi.project.Project
import java.time.Instant
import kotlin.Boolean
import kotlin.Double
import kotlin.Long
import kotlin.String
import kotlin.Suppress
import software.amazon.awssdk.services.toolkittelemetry.model.Unit
import software.aws.toolkits.core.ConnectionSettings
import software.aws.toolkits.jetbrains.services.telemetry.MetricEventMetadata
import software.aws.toolkits.jetbrains.services.telemetry.TelemetryService

public object LambdaTelemetry {
    /**
     * called when creating lambdas remotely
     */
    public fun create(
        project: Project?,
        lambdaRuntime: LambdaRuntime,
        arbitraryString: String,
        duration: Double? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(project) {
            datum("lambda_create") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                metadata("lambdaRuntime", lambdaRuntime.toString())
                metadata("arbitraryString", arbitraryString)
                if(duration != null) {
                    metadata("duration", duration.toString())
                }
            }
        }
    }

    /**
     * called when creating lambdas remotely
     */
    public fun create(
        connectionSettings: ConnectionSettings? = null,
        lambdaRuntime: LambdaRuntime,
        arbitraryString: String,
        duration: Double? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(connectionSettings) {
            datum("lambda_create") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                metadata("lambdaRuntime", lambdaRuntime.toString())
                metadata("arbitraryString", arbitraryString)
                if(duration != null) {
                    metadata("duration", duration.toString())
                }
            }
        }
    }

    /**
     * called when creating lambdas remotely
     */
    public fun create(
        metadata: MetricEventMetadata,
        lambdaRuntime: LambdaRuntime,
        arbitraryString: String,
        duration: Double? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(metadata) {
            datum("lambda_create") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                metadata("lambdaRuntime", lambdaRuntime.toString())
                metadata("arbitraryString", arbitraryString)
                if(duration != null) {
                    metadata("duration", duration.toString())
                }
            }
        }
    }

    /**
     * called when deleting lambdas remotely
     */
    public fun delete(
        project: Project?,
        duration: Double,
        booltype: Boolean,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(project) {
            datum("lambda_delete") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                metadata("duration", duration.toString())
                metadata("booltype", booltype.toString())
            }
        }
    }

    /**
     * called when deleting lambdas remotely
     */
    public fun delete(
        connectionSettings: ConnectionSettings? = null,
        duration: Double,
        booltype: Boolean,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(connectionSettings) {
            datum("lambda_delete") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                metadata("duration", duration.toString())
                metadata("booltype", booltype.toString())
            }
        }
    }

    /**
     * called when deleting lambdas remotely
     */
    public fun delete(
        metadata: MetricEventMetadata,
        duration: Double,
        booltype: Boolean,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(metadata) {
            datum("lambda_delete") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                metadata("duration", duration.toString())
                metadata("booltype", booltype.toString())
            }
        }
    }

    /**
     * called when invoking lambdas remotely
     */
    public fun remoteinvoke(
        project: Project?,
        lambdaRuntime: LambdaRuntime? = null,
        inttype: Long,
        duration: Double? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(project) {
            datum("lambda_remoteinvoke") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                if(lambdaRuntime != null) {
                    metadata("lambdaRuntime", lambdaRuntime.toString())
                }
                metadata("inttype", inttype.toString())
                if(duration != null) {
                    metadata("duration", duration.toString())
                }
            }
        }
    }

    /**
     * called when invoking lambdas remotely
     */
    public fun remoteinvoke(
        connectionSettings: ConnectionSettings? = null,
        lambdaRuntime: LambdaRuntime? = null,
        inttype: Long,
        duration: Double? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(connectionSettings) {
            datum("lambda_remoteinvoke") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                if(lambdaRuntime != null) {
                    metadata("lambdaRuntime", lambdaRuntime.toString())
                }
                metadata("inttype", inttype.toString())
                if(duration != null) {
                    metadata("duration", duration.toString())
                }
            }
        }
    }

    /**
     * called when invoking lambdas remotely
     */
    public fun remoteinvoke(
        metadata: MetricEventMetadata,
        lambdaRuntime: LambdaRuntime? = null,
        inttype: Long,
        duration: Double? = null,
        passive: Boolean = false,
        `value`: Double = 1.0,
        createTime: Instant = Instant.now(),
    ) {
        TelemetryService.getInstance().record(metadata) {
            datum("lambda_remoteinvoke") {
                createTime(createTime)
                unit(Unit.NONE)
                value(value)
                passive(passive)
                if(lambdaRuntime != null) {
                    metadata("lambdaRuntime", lambdaRuntime.toString())
                }
                metadata("inttype", inttype.toString())
                if(duration != null) {
                    metadata("duration", duration.toString())
                }
            }
        }
    }
}
