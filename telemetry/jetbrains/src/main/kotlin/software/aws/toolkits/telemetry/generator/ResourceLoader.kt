// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

object ResourceLoader {
    private const val schemaPath = "/telemetrySchema.json"

    val SCHEMA_FILE = this.javaClass.getResourceAsStream(schemaPath).use { it.bufferedReader().readText() }
    // TODO add a manifest or something
    val DEFINITIONS_FILES = listOf("/definitions/clouddebugDefinitions.json", "/definitions/commonDefinitions.json").map {
        this.javaClass.getResourceAsStream(it).use {
            it.bufferedReader().readText()
        }
    }
}
