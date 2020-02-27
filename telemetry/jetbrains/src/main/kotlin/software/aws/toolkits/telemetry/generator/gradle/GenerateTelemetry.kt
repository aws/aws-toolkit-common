// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator.gradle

import org.gradle.api.DefaultTask
import org.gradle.api.tasks.InputFiles
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction
import software.aws.toolkits.telemetry.generator.generateTelemetryFromFiles
import java.io.File

open class GenerateTelemetry : DefaultTask() {
    @InputFiles
    lateinit var inputFiles: List<File>

    @OutputDirectory
    lateinit var outputDirectory: File

    @TaskAction
    fun generate() {
        println("Generating telemetry using packaged file and additional files:\n ${inputFiles.joinToString("\n") { it.absolutePath }}")
        try {
            generateTelemetryFromFiles(inputFiles = inputFiles, outputFolder = outputDirectory)
        } catch (e: Exception) {
            System.err.println("Generating telemetry threw an exception! $e\n")
            throw e
        }
    }
}
