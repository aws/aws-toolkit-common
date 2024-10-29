// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
@file:Suppress("unused", "MemberVisibilityCanBePrivate")

package software.aws.toolkits.telemetry

import kotlin.String
import kotlin.Suppress

/**
 * The lambda runtime
 */
public enum class LambdaRuntime(
    private val `value`: String,
) {
    Dotnetcore21("dotnetcore2.1"),
    Nodejs12x("nodejs12.x"),
    Unknown("unknown"),
    ;

    override fun toString(): String = value

    public companion object {
        public fun from(type: String): LambdaRuntime = values().firstOrNull { it.value == type } ?: Unknown
    }
}
