// Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.telemetry

import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.Test

class ParserTest {
    @Test
    fun typeMissingDescription() {
        assertThatThrownBy {
            TelemetryParser.parseFiles(
                listOf(),
                """
            {
                "types": [
                    {
                        "name": "result",
                        "allowedValues": ["Succeeded", "Failed", "Cancelled"],
                    }
                ],
                "metrics": []
            }
            """.trimIndent()
            )
        }.hasMessageContaining("required key [description] not found")
    }

    @Test
    fun missingMetricsField() {
        assertThatThrownBy {
            TelemetryParser.parseFiles(listOf(), """{"types": []}""")
        }.hasMessageContaining("required key [metrics] not found")
    }

    @Test
    fun invalidDataTypes() {
        assertThatThrownBy {
            TelemetryParser.parseFiles(
                listOf(),
                """
            {
                "types": [
                    {
                        "name": "result",
                        "type": "type that does not exist",
                        "description": "abc"
                    }
                ],
                "metrics": []
            }
            """.trimIndent()
            )
        }.hasMessageContaining("type that does not exist is not a valid enum value")

    }

    @Test
    fun successfulParse() {
        TelemetryParser.parseFiles(
            listOf(),
            """
            {
                "metrics": []
            }
            """.trimIndent()
        )
    }
}
