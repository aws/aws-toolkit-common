// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

object ResourceLoader {
    private const val SCHEMA_PATH = "/telemetrySchema.json"

    val SCHEMA_FILE = this.javaClass.getResourceAsStream(SCHEMA_PATH).use { it.bufferedReader().readText() }

    // TODO add a manifest or something
    val DEFINITIONS_FILES =
        listOf("/definitions/commonDefinitions.json").map {
            this.javaClass.getResourceAsStream(it).use {
                it.bufferedReader().readText()
            }
        }
}
