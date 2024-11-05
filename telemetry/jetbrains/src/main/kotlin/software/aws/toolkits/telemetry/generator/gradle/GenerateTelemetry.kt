// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator.gradle

import org.gradle.api.DefaultTask
import org.gradle.api.file.ConfigurableFileCollection
import org.gradle.api.file.DirectoryProperty
import org.gradle.api.tasks.InputFiles
import org.gradle.api.tasks.OutputDirectory
import org.gradle.api.tasks.PathSensitive
import org.gradle.api.tasks.PathSensitivity
import org.gradle.api.tasks.TaskAction
import software.aws.toolkits.telemetry.generator.OTelTelemetryGenerator
import software.aws.toolkits.telemetry.generator.generateTelemetryFromFiles

abstract class GenerateTelemetry : DefaultTask() {
    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    abstract val inputFiles: ConfigurableFileCollection

    @get:OutputDirectory
    abstract val outputDirectory: DirectoryProperty

    @TaskAction
    fun generate() {
        println("Generating telemetry using packaged file and additional files:\n ${inputFiles.joinToString("\n") { it.absolutePath }}")
        try {
            generateTelemetryFromFiles(inputFiles = inputFiles.toList(), outputFolder = outputDirectory.get().asFile)
            OTelTelemetryGenerator.generateTelemetryFromFiles(inputFiles = inputFiles.toList(), outputFolder = outputDirectory.get().asFile)
        } catch (e: Exception) {
            System.err.println("Generating telemetry threw an exception! $e\n")
            throw e
        }
    }
}
