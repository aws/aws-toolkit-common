// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.nio.file.Files
import java.nio.file.Paths

class GeneratorTest {
    @JvmField
    @Rule
    val folder = TemporaryFolder()

    @Test
    fun generateFailsWhenValidationFails() {
        assertThatThrownBy {
            TelemetryGenerator.generateTelemetryFromFiles(inputFiles = listOf(), defaultDefinitions = listOf("{}"), outputFolder = folder.root)
        }.hasMessageContaining("required key [metrics] not found")
    }

    @Test
    fun generateGenerates() {
        testGenerator("/testGeneratorInput.json", "/testGeneratorOutput")
    }

    @Test
    fun generateGeneratesTwoFunctionsForResult() {
        testGenerator("/testResultInput.json", "/testResultOutput")
    }

    @Test
    fun generateGeneratesWithDefaultDefinitions() {
        TelemetryGenerator.generateTelemetryFromFiles(inputFiles = listOf(), outputFolder = folder.root)
        val outputFile = Paths.get(folder.root.absolutePath, "software", "aws", "toolkits", "telemetry", "TelemetryDefinitions.kt")
        assertThat(Files.exists(outputFile)).isTrue
    }

    // inputPath and outputPath must be in test resources
    private fun testGenerator(inputPath: String, outputPath: String) {
        TelemetryGenerator.generateTelemetryFromFiles(
            inputFiles = listOf(),
            defaultDefinitions = listOf(this.javaClass.getResourceAsStream(inputPath).use { it.bufferedReader().readText() }),
            outputFolder = folder.root
        )

        val outputFile = Paths.get(folder.root.absolutePath, "software", "aws", "toolkits", "telemetry", "TelemetryDefinitions.kt")
        assertThat(Files.exists(outputFile)).isTrue

        assertThat(outputFile.toFile().readText()).isEqualToIgnoringWhitespace(
            this.javaClass.getResourceAsStream(outputPath).use {
                it.bufferedReader().readText()
            })
    }
}
