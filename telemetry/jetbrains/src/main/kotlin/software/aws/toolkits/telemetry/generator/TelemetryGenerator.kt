// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import com.squareup.kotlinpoet.FileSpec
import java.io.File

const val PACKAGE_NAME = "software.aws.toolkits.telemetry"
const val RESULT = "result"
const val SUCCESS = "success"

fun String.filterInvalidCharacters() = this.replace(".", "")
fun String.toTypeFormat() = this.filterInvalidCharacters().capitalize()
fun String.toArgumentFormat() = this.filterInvalidCharacters().toLowerCase()

fun generateTelemetryFromFiles(
    inputFiles: List<File>,
    defaultDefinitions: List<String> = ResourceLoader.DEFINITIONS_FILES,
    outputFolder: File
) {
    val telemetry = TelemetryParser.parseFiles(inputFiles, defaultDefinitions)
    // make sure the output directory exists before writing to it
    outputFolder.mkdirs()
    FileSpec.builder(PACKAGE_NAME, "TelemetryDefinitions")
        .generateHeader()
        .generateTelemetryEnumTypes(telemetry.types)
        .generateTelemetryObjects(telemetry)
        .build()
        .writeTo(outputFolder)
}
