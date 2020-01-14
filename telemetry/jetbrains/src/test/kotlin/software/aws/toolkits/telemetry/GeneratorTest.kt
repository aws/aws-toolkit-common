// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry

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
            generateTelemetryFromFiles(listOf(), folder.root, "{}")
        }.hasMessageContaining("required key [metrics] not found")
    }

    @Test
    fun generateGenerates() {
        generateTelemetryFromFiles(
            listOf(), folder.root,
            """
                    {
                        "types": [
                            {
                                "name": "lambdaRuntime",
                                "type": "string",
                                "allowedValues": [
                                    "dotnetcore2.1",
                                    "nodejs12.x"
                                ],
                                "description": "The lambda runtime"
                            },
                            {
                                "name": "duration",
                                "type": "double",
                                "description": "The duration of the operation in miliseconds"
                            },
                            {
                                "name": "inttype",
                                "description": "a test int type",
                                "type": "int"
                            },
                            {
                                "name": "booltype",
                                "description": "a test boolean type",
                                "type": "boolean"
                            },
                            {
                                "name": "arbitraryString",
                                "description": "untyped string type"
                            }
                        ],
                        "metrics": [
                            {
                                "name": "lambda_delete",
                                "description": "called when deleting lambdas remotely",
                                "unit": "None",
                                "metadata": [{ "type": "duration" }, { "type": "booltype" }]
                            },
                            {
                                "name": "lambda_create",
                                "description": "called when creating lambdas remotely",
                                "unit": "None",
                                "metadata": [{ "type": "lambdaRuntime" }, { "type": "arbitraryString" } ]
                            },
                            {
                                "name": "lambda_remoteinvoke",
                                "description": "called when invoking lambdas remotely",
                                "unit": "None",
                                "metadata": [{ "type": "lambdaRuntime", "required": false }, { "type": "inttype" }]
                            }
                        ]
                    }
                """.trimIndent()
        )

        val outputFile = Paths.get(folder.root.absolutePath, "software", "aws", "toolkits", "telemetry", "TelemetryDefinitions.kt")
        assertThat(Files.exists(outputFile)).isTrue

        assertThat(outputFile.toFile().readText()).isEqualToIgnoringWhitespace(
            """
                // THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
                package software.amazon.toolkits.telemetry

                import com.intellij.openapi.project.Project
                import kotlin.Any
                import kotlin.Boolean
                import kotlin.Double
                import kotlin.Int
                import kotlin.String
                import software.amazon.awssdk.services.toolkittelemetry.model.Unit
                import software.aws.toolkits.jetbrains.services.telemetry.TelemetryService

                /**
                 * The lambda runtime
                 */
                enum class LambdaRuntime(
                  name: String
                ) {
                  DOTNETCORE21("dotnetcore2.1"),

                  NODEJS12X("nodejs12.x");

                  override fun toString(): String = name

                  fun from(type: Any): LambdaRuntime = values().filter { it.name == type.toString() }.first()
                }

                object LambdaTelemetry {
                  /**
                   * called when creating lambdas remotely
                   */
                  fun recordCreate(
                    project: Project?,
                    value: Double = 1.0,
                    lambdaruntime: LambdaRuntime,
                    arbitrarystring: String
                  ) {
                    TelemetryService.getInstance().record(project) { 
                    datum("lambda_create") {
                    unit(Unit.NONE)
                    value(value)
                    metadata("lambdaruntime", lambdaruntime.toString())
                    metadata("arbitrarystring", arbitrarystring.toString())
                    }}
                  }

                  /**
                   * called when deleting lambdas remotely
                   */
                  fun recordDelete(
                    project: Project?,
                    value: Double = 1.0,
                    duration: Double,
                    booltype: Boolean
                  ) {
                    TelemetryService.getInstance().record(project) { 
                    datum("lambda_delete") {
                    unit(Unit.NONE)
                    value(value)
                    metadata("duration", duration.toString())
                    metadata("booltype", booltype.toString())
                    }}
                  }

                  /**
                   * called when invoking lambdas remotely
                   */
                  fun recordRemoteinvoke(
                    project: Project?,
                    value: Double = 1.0,
                    lambdaruntime: LambdaRuntime,
                    inttype: Int
                  ) {
                    TelemetryService.getInstance().record(project) { 
                    datum("lambda_remoteinvoke") {
                    unit(Unit.NONE)
                    value(value)
                    metadata("lambdaruntime", lambdaruntime.toString())
                    metadata("inttype", inttype.toString())
                    }}
                  }
                }
            """.trimIndent()
        )
    }
}
