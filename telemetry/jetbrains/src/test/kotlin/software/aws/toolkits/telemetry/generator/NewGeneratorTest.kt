package software.aws.toolkits.telemetry.generator

import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.TestInfo
import org.junit.jupiter.api.io.TempDir
import java.io.File
import java.nio.file.Files
import java.nio.file.Paths
import kotlin.io.path.isRegularFile
import kotlin.io.path.readText
import kotlin.io.path.toPath

class NewGeneratorTest {
    @TempDir
    private lateinit var folder: File

    private lateinit var methodName: String

    @BeforeEach
    fun setUp(info: TestInfo) {
        methodName = info.testMethod.get().name
    }

    @Test
    fun generateOTelBaseSpan() {
        testGenerator()
    }

    @Test
    fun generatesOTelWithNormalInput() {
        testGenerator()
    }

    @Test
    fun generatesWithDefaultDefinitions() {
        OTelTelemetryGenerator.generateTelemetryFromFiles(inputFiles = listOf(), outputFolder = folder)
        val outputFile = Paths.get(folder.absolutePath, "software", "aws", "toolkits", "telemetry")
        assertThat(Files.walk(outputFile).toList()).isNotEmpty
    }

    // inputPath and outputPath must be in test resources
    private fun testGenerator(
        definitionsFile: String? = null,
        definitionsOverrides: List<String> = listOf(),
    ) {
        OTelTelemetryGenerator.generateTelemetryFromFiles(
            defaultDefinitions =
                listOf(
                    this.javaClass.getResourceAsStream(definitionsFile ?: "/$methodName/input.json").use {
                        it.bufferedReader().readText()
                    },
                ),
            inputFiles = definitionsOverrides.map { File(javaClass.getResource(it).toURI()) },
            outputFolder = folder,
        )

        val outputRoot = Paths.get(folder.absolutePath)
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
