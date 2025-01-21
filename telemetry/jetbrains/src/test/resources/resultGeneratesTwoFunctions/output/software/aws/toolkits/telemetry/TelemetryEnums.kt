// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry

import kotlin.Deprecated
import kotlin.String
import kotlin.Suppress

/**
 * The result of the operation
 */
public enum class MetricResult(
    private val `value`: String,
) {
    Succeeded("Succeeded"),
    Failed("Failed"),
    Cancelled("Cancelled"),
    CamelCase("CamelCase"),
    DashSeparated("dash-separated"),
    UnderscoreSeparated("underscore_separated"),
    Unknown("unknown"),
    ;

    override fun toString(): String = value

    public companion object {
        public fun from(type: String): MetricResult = values().firstOrNull { it.value == type } ?: Unknown
    }
}

@Deprecated(
    message = "Name conflicts with the Kotlin standard library",
    replaceWith = ReplaceWith("MetricResult", "software.aws.toolkits.telemetry.MetricResult"),
)
public typealias Result = MetricResult
