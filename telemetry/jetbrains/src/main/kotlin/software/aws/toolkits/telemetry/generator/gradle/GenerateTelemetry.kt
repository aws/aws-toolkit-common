// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator.gradle

import org.gradle.api.DefaultTask
import org.gradle.api.tasks.InputFiles
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.TaskAction
import software.aws.toolkits.telemetry.generator.TelemetryGenerator
import java.io.File

open class GenerateTelemetry : DefaultTask() {
    @InputFiles
    lateinit var inputFiles: List<File>

    @OutputDirectory
    lateinit var outputDirectory: File

    @TaskAction
    fun generate() {
        println("Generating telemetry using packaged file and:\n ${inputFiles.map { it.absolutePath }.joinToString("\n")}")
        try {
            TelemetryGenerator.generateTelemetryFromFiles(inputFiles, outputDirectory)
        } catch (e: Exception) {
            System.err.println("Generating telemetry threw an exception! $e\n")
            throw e
        }
    }
}
