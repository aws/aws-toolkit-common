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
 * called when invoking lambdas remotely
 */
public class NometadataSpan internal constructor(
    context: Context?,
    span: Span,
) : BaseSpan<NometadataSpan>(context, span) {
    init {
        passive(false)
    }

    override val requiredFields: Collection<String> = setOf()
}

public class NometadataSpanBuilder internal constructor(
    `delegate`: SpanBuilder,
) : AbstractSpanBuilder<NometadataSpanBuilder, NometadataSpan>(delegate) {
    override fun doStartSpan(): NometadataSpan = NometadataSpan(parent, delegate.startSpan())
}

public class NoTracer internal constructor(
    private val `delegate`: Tracer,
) : Tracer {
    /**
     * called when invoking lambdas remotely
     */
    public val metadata: NometadataSpanBuilder
        get() = NometadataSpanBuilder(delegate.spanBuilder("no_metadata"))

    override fun spanBuilder(spanName: String): DefaultSpanBuilder = DefaultSpanBuilder(delegate.spanBuilder(spanName))
}
