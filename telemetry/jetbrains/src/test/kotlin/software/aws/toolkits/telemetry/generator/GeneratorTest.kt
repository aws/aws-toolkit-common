// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths

class GeneratorTest {
    @JvmField
    @Rule
    val folder = TemporaryFolder()

    @Test
    fun generateFailsWhenValidationFails() {
        assertThatThrownBy {
            generateTelemetryFromFiles(inputFiles = listOf(), defaultDefinitions = listOf("{}"), outputFolder = folder.root)
        }.hasMessageContaining("required key [metrics] not found")
    }

    @Test
    fun generatesWithNormalInput() {
        testGenerator(defaultDefinitionsFile = "/testGeneratorInput.json", expectedOutputFile = "/testGeneratorOutput")
    }

    @Test
    fun resultGeneratesTwoFunctions() {
        testGenerator(defaultDefinitionsFile = "/testResultInput.json", expectedOutputFile = "/testResultOutput")
    }

    @Test
    fun generateOverrides() {
        testGenerator(defaultDefinitionsFile = "/testResultInput.json", definitionsOverrides = listOf("/testOverrideInput.json"), expectedOutputFile = "/testOverrideOutput")
    }

    @Test
    fun generateAllowedValuesWithUnderscores() {
        testGenerator(defaultDefinitionsFile = "/testGeneratorAllowedValuesInput.json", expectedOutputFile = "/testGeneratorAllowedValuesOutput")
    }

    @Test
    fun longEnum() {
        testGenerator(defaultDefinitionsFile = "/testLongEnumInput.json", expectedOutputFile = "/testLongEnumOutput")
    }

    @Test
    fun generateGeneratesWithDefaultDefinitions() {
        generateTelemetryFromFiles(inputFiles = listOf(), outputFolder = folder.root)
        val outputFile = Paths.get(folder.root.absolutePath, "software", "aws", "toolkits", "telemetry", "TelemetryDefinitions.kt")
        assertThat(Files.exists(outputFile)).isTrue
    }

    // inputPath and outputPath must be in test resources
    private fun testGenerator(defaultDefinitionsFile: String, definitionsOverrides: List<String> = listOf(), expectedOutputFile: String) {
        generateTelemetryFromFiles(
            defaultDefinitions = listOf(this.javaClass.getResourceAsStream(defaultDefinitionsFile).use { it.bufferedReader().readText() }),
            inputFiles = definitionsOverrides.map { File(javaClass.getResource(it).toURI()) },
            outputFolder = folder.root
        )

        val outputFile = Paths.get(folder.root.absolutePath, "software", "aws", "toolkits", "telemetry", "TelemetryDefinitions.kt")
        assertThat(outputFile).exists()

        val expected = this.javaClass.getResourceAsStream(expectedOutputFile).use {
            it.bufferedReader().readText()
        }

        assertThat(outputFile.toFile().readText()).isEqualTo(expected)
    }
}
