// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry.`impl`

import io.opentelemetry.api.trace.Span
import io.opentelemetry.context.Context
import io.opentelemetry.sdk.trace.ReadWriteSpan
import kotlin.Boolean
import kotlin.Double
import kotlin.Float
import kotlin.Number
import kotlin.Suppress
import software.amazon.awssdk.services.toolkittelemetry.model.MetricUnit
import software.aws.toolkits.jetbrains.services.telemetry.otel.AbstractBaseSpan

public open class BaseSpan<SpanType : BaseSpan<SpanType>>(
    context: Context?,
    `delegate`: Span,
) : AbstractBaseSpan<SpanType>(context, delegate as ReadWriteSpan) {
    /**
     * The duration of the operation in miliseconds
     */
    public fun duration(duration: Float?) {
        metadata("duration", duration?.let { it.toString() })
    }

    /**
     * The duration of the operation in miliseconds
     */
    public fun duration(duration: Double?) {
        metadata("duration", duration?.let { it.toString() })
    }

    public fun passive(passive: Boolean) {
        this._passive = passive
    }

    public fun unit(unit: MetricUnit) {
        this._unit = unit
    }

    public fun `value`(`value`: Number) {
        this._value = `value`.toDouble()
    }
}
