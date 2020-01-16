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

class GeneratorTest() {
    @JvmField
    @Rule
    val folder = TemporaryFolder()

    @Test
    fun generateFailsWhenvalidationFails() {
        assertThatThrownBy {
            TelemetryGenerator.generateTelemetryFromFiles(listOf(), folder.root, "{}")
        }.hasMessageContaining("required key [metrics] not found")
    }

    @Test
    fun generateGenerates() {
        TelemetryGenerator.generateTelemetryFromFiles(
            listOf(),
            folder.root,
            this.javaClass.getResourceAsStream("/testGeneratorInput.json").use { it.bufferedReader().readText() })

        val outputFile = Paths.get(folder.root.absolutePath, "software", "aws", "toolkits", "telemetry", "TelemetryDefinitions.kt")
        assertThat(Files.exists(outputFile)).isTrue

        assertThat(outputFile.toFile().readText()).isEqualToIgnoringWhitespace(this.javaClass.getResourceAsStream("/testGeneratorOutput.kt").use {
            it.bufferedReader().readText()
        })
    }
}
