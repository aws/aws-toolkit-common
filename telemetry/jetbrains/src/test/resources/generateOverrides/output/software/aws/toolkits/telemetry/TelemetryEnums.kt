// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry

import kotlin.String
import kotlin.Suppress

/**
 * The result of the operation
 */
public enum class MetricResult(
    private val `value`: String,
) {
    Succeeded("Succeeded"),
    Unknown("unknown"),
    ;

    override fun toString(): String = value

    public companion object {
        public fun from(type: String): MetricResult = values().firstOrNull { it.value == type } ?: Unknown
    }
}
