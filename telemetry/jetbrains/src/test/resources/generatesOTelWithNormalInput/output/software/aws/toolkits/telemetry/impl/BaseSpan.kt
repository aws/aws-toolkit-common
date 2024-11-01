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
import kotlin.Suppress
import software.aws.toolkits.jetbrains.services.telemetry.otel.AbstractBaseSpan

public open class BaseSpan<SpanType : BaseSpan<SpanType>>(
    context: Context?,
    `delegate`: Span,
) : AbstractBaseSpan<SpanType>(context, delegate as ReadWriteSpan) {
    /**
     * The duration of the operation in miliseconds
     */
    public fun duration(duration: Float?): SpanType = metadata("duration", duration?.let { it.toString() })

    /**
     * The duration of the operation in miliseconds
     */
    public fun duration(duration: Double?): SpanType = metadata("duration", duration?.let { it.toString() })

    public fun success(success: Boolean): SpanType {
        result(if(success) MetricResult.Succeeded else MetricResult.Failed)
        return this as SpanType
    }
}
