// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry

import kotlin.Deprecated
import kotlin.String
import kotlin.Suppress

/**
 * an enum
 */
public enum class Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa(
    private val `value`: String,
) {
    A("A"),
    B("B"),
    C("C"),
    D("D"),
    Unknown("unknown"),
    ;

    override fun toString(): String = value

    public companion object {
        public fun from(type: String): Aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa = values().firstOrNull { it.value == type } ?: Unknown
    }
}

@Deprecated(
    message = "Name conflicts with the Kotlin standard library",
    replaceWith = ReplaceWith("MetricResult", "software.aws.toolkits.telemetry.MetricResult"),
)
public typealias Result = MetricResult
