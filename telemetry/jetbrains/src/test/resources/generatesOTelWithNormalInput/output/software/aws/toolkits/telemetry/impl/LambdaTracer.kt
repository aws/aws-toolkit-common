// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry.`impl`

import io.opentelemetry.api.trace.Span
import io.opentelemetry.api.trace.SpanBuilder
import io.opentelemetry.api.trace.Tracer
import io.opentelemetry.context.Context
import kotlin.Boolean
import kotlin.Int
import kotlin.Long
import kotlin.String
import kotlin.Suppress
import kotlin.collections.Collection
import software.aws.toolkits.jetbrains.services.telemetry.otel.AbstractSpanBuilder
import software.aws.toolkits.jetbrains.services.telemetry.otel.DefaultSpanBuilder
import software.aws.toolkits.telemetry.LambdaRuntime

/**
 * called when deleting lambdas remotely
 */
public class LambdadeleteSpan internal constructor(
    context: Context?,
    span: Span,
) : BaseSpan<LambdadeleteSpan>(context, span) {
    init {
        passive(false)
    }

    override val requiredFields: Collection<String> = setOf("duration","booltype",)

    /**
     * a test boolean type
     */
    public fun booltype(booltype: Boolean) {
        metadata("booltype", booltype.toString())
    }
}

public class LambdadeleteSpanBuilder internal constructor(
    `delegate`: SpanBuilder,
) : AbstractSpanBuilder<LambdadeleteSpanBuilder, LambdadeleteSpan>(delegate) {
    override fun doStartSpan(): LambdadeleteSpan = LambdadeleteSpan(parent, delegate.startSpan())
}

/**
 * called when creating lambdas remotely
 */
public class LambdacreateSpan internal constructor(
    context: Context?,
    span: Span,
) : BaseSpan<LambdacreateSpan>(context, span) {
    init {
        passive(false)
    }

    override val requiredFields: Collection<String> = setOf("lambdaRuntime","arbitraryString",)

    /**
     * The lambda runtime
     */
    public fun lambdaRuntime(lambdaRuntime: LambdaRuntime) {
        metadata("lambdaRuntime", lambdaRuntime.toString())
    }

    /**
     * untyped string type
     */
    public fun arbitraryString(arbitraryString: String) {
        metadata("arbitraryString", arbitraryString)
    }
}

public class LambdacreateSpanBuilder internal constructor(
    `delegate`: SpanBuilder,
) : AbstractSpanBuilder<LambdacreateSpanBuilder, LambdacreateSpan>(delegate) {
    override fun doStartSpan(): LambdacreateSpan = LambdacreateSpan(parent, delegate.startSpan())
}

/**
 * called when invoking lambdas remotely
 */
public class LambdaremoteinvokeSpan internal constructor(
    context: Context?,
    span: Span,
) : BaseSpan<LambdaremoteinvokeSpan>(context, span) {
    init {
        passive(false)
    }

    override val requiredFields: Collection<String> = setOf("inttype",)

    /**
     * The lambda runtime
     */
    public fun lambdaRuntime(lambdaRuntime: LambdaRuntime?) {
        metadata("lambdaRuntime", lambdaRuntime?.let { it.toString() })
    }

    /**
     * a test int type
     */
    public fun inttype(inttype: Long) {
        metadata("inttype", inttype.toString())
    }

    /**
     * a test int type
     */
    public fun inttype(inttype: Int) {
        metadata("inttype", inttype.toString())
    }
}

public class LambdaremoteinvokeSpanBuilder internal constructor(
    `delegate`: SpanBuilder,
) : AbstractSpanBuilder<LambdaremoteinvokeSpanBuilder, LambdaremoteinvokeSpan>(delegate) {
    override fun doStartSpan(): LambdaremoteinvokeSpan = LambdaremoteinvokeSpan(parent, delegate.startSpan())
}

public class LambdaTracer internal constructor(
    private val `delegate`: Tracer,
) : Tracer {
    /**
     * called when deleting lambdas remotely
     */
    public val delete: LambdadeleteSpanBuilder
        get() = LambdadeleteSpanBuilder(delegate.spanBuilder("lambda_delete"))

    /**
     * called when creating lambdas remotely
     */
    public val create: LambdacreateSpanBuilder
        get() = LambdacreateSpanBuilder(delegate.spanBuilder("lambda_create"))

    /**
     * called when invoking lambdas remotely
     */
    public val remoteinvoke: LambdaremoteinvokeSpanBuilder
        get() = LambdaremoteinvokeSpanBuilder(delegate.spanBuilder("lambda_remoteinvoke"))

    override fun spanBuilder(spanName: String): DefaultSpanBuilder = DefaultSpanBuilder(delegate.spanBuilder(spanName))
}
