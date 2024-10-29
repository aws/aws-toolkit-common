// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry.generator

import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import org.junit.rules.TestName
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths
import kotlin.io.path.isRegularFile
import kotlin.io.path.readText
import kotlin.io.path.toPath

class GeneratorTest {
    @JvmField
    @Rule
    val folder = TemporaryFolder()

    @Rule
    @JvmField
    val testName = TestName()

    @Test
    fun generateFailsWhenValidationFails() {
        assertThatThrownBy {
            generateTelemetryFromFiles(inputFiles = listOf(), defaultDefinitions = listOf("{}"), outputFolder = folder.root)
        }.hasMessageContaining("required key [metrics] not found")
    }

    @Test
    fun generateWithGlobalMetadata() {
        testGenerator()
    }

    @Test
    fun generatesWithNormalInput() {
        testGenerator()
    }

    @Test
    fun resultGeneratesTwoFunctions() {
        testGenerator()
    }

    @Test
    fun generateOverrides() {
        testGenerator(
            definitionsFile = "/resultGeneratesTwoFunctions/input.json",
            definitionsOverrides = listOf("/generateOverrides/overrideInput.json"),
        )
    }

    @Test
    fun longEnum() {
        testGenerator()
    }

    @Test
    fun generateGeneratesWithDefaultDefinitions() {
        generateTelemetryFromFiles(inputFiles = listOf(), outputFolder = folder.root)
        val outputFile = Paths.get(folder.root.absolutePath, "software", "aws", "toolkits", "telemetry")
        assertThat(Files.walk(outputFile).toList()).isNotEmpty
    }

    // inputPath and outputPath must be in test resources
    private fun testGenerator(
        definitionsFile: String? = null,
        definitionsOverrides: List<String> = listOf(),
    ) {
        val methodName = testName.methodName
        generateTelemetryFromFiles(
            defaultDefinitions =
                listOf(
                    this.javaClass.getResourceAsStream(definitionsFile ?: "/$methodName/input.json").use {
                        it.bufferedReader().readText()
                    },
                ),
            inputFiles = definitionsOverrides.map { File(javaClass.getResource(it).toURI()) },
            outputFolder = folder.root,
        )

        val outputRoot = Paths.get(folder.root.absolutePath)
        val outputFiles = Files.walk(outputRoot).filter { it.isRegularFile() }.toList()
        val expectedRoot = this.javaClass.getResource("/$methodName").toURI().toPath().resolve("output")
        val expectedFiles = Files.walk(expectedRoot).filter { it.isRegularFile() }.toList()

        if (expectedFiles.isEmpty()) {
            // for dev convenience, populate the test files and consider it a pass
            val root = Paths.get("src", "test", "resources", methodName, "output")
            outputFiles.forEach {
                val dest = root.resolve(outputRoot.relativize(it))
                Files.createDirectories(dest.parent)
                Files.copy(it, dest)
            }
            return
        }

        assertThat(outputFiles.map { outputRoot.relativize(it) })
            .containsExactlyInAnyOrder(*expectedFiles.map { expectedRoot.relativize(it) }.toTypedArray())

        outputFiles.forEach {
            val relPath = outputRoot.relativize(it)
            assertThat(it.readText()).isEqualTo(expectedRoot.resolve(relPath).readText())
        }
    }
}
