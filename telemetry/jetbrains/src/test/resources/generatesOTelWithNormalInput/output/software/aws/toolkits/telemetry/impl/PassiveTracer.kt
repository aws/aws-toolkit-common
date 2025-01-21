// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry.`impl`

import io.opentelemetry.api.trace.Span
import io.opentelemetry.api.trace.SpanBuilder
import io.opentelemetry.api.trace.Tracer
import io.opentelemetry.context.Context
import kotlin.String
import kotlin.Suppress
import kotlin.collections.Collection
import software.aws.toolkits.jetbrains.services.telemetry.otel.AbstractSpanBuilder
import software.aws.toolkits.jetbrains.services.telemetry.otel.DefaultSpanBuilder

/**
 * a passive metric
 */
public class PassivepassiveSpan internal constructor(
    context: Context?,
    span: Span,
) : BaseSpan<PassivepassiveSpan>(context, span) {
    override val requiredFields: Collection<String> = setOf()
}

public class PassivepassiveSpanBuilder internal constructor(
    `delegate`: SpanBuilder,
) : AbstractSpanBuilder<PassivepassiveSpanBuilder, PassivepassiveSpan>(delegate) {
    override fun doStartSpan(): PassivepassiveSpan = PassivepassiveSpan(parent, delegate.startSpan())
}

public class PassiveTracer internal constructor(
    private val `delegate`: Tracer,
) : Tracer {
    /**
     * a passive metric
     */
    public val passive: PassivepassiveSpanBuilder
        get() = PassivepassiveSpanBuilder(delegate.spanBuilder("passive_passive"))

    override fun spanBuilder(spanName: String): DefaultSpanBuilder = DefaultSpanBuilder(delegate.spanBuilder(spanName))
}
