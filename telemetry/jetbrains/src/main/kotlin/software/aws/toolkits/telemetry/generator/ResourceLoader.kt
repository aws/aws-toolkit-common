// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

object ResourceLoader {
    private val schemaPath = "/telemetrySchema.json"
    private val definitionsPath = "/commonDefinitions.json"
    private val jetbrainsDefinitionsPath = "/jetbrainsDefinitions.json"

    val SCHEMA_FILE = this.javaClass.getResourceAsStream(schemaPath).use { it.bufferedReader().readText() }
    val DEFINITONS_FILE = this.javaClass.getResourceAsStream(definitionsPath).use { it.bufferedReader().readText() }
    val JETBRAINS_DEFINITONS_FILE = this.javaClass.getResourceAsStream(jetbrainsDefinitionsPath).use { it.bufferedReader().readText() }
}
