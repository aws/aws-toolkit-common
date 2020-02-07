// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import java.io.File

object ResourceLoader {
    private val schemaPath = "/telemetrySchema.json"

    val SCHEMA_FILE = this.javaClass.getResourceAsStream(schemaPath).use { it.bufferedReader().readText() }
    val DEFINITONS_FILES = File(this.javaClass.getResource("/definitions").toURI())
        .listFiles()
        ?.mapNotNull { it.bufferedReader().readText() }
        ?: listOf()
}
