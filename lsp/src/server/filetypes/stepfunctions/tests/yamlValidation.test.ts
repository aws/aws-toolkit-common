/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert'
import { MESSAGES, YAML_PARSER_MESSAGES } from '../constants/diagnosticStrings'

import {
    documentChoiceDefaultBeforeChoice,
    documentChoiceInvalidDefault,
    documentChoiceInvalidNext,
    documentChoiceNoDefault,
    documentChoiceValidDefault,
    documentChoiceValidNext,
    documentDuplicateKey,
    documentInvalidNext,
    documentInvalidNextNested,
    documentInvalidParametersIntrinsicFunction,
    documentInvalidParametersJsonPath,
    documentInvalidPropertiesCatch,
    documentInvalidPropertiesChoices,
    documentInvalidPropertiesRoot,
    documentInvalidPropertiesRootNested,
    documentInvalidPropertiesState,
    documentInvalidResultSelectorIntrinsicFunction,
    documentInvalidResultSelectorJsonPath,
    documentMapCatchTemplate,
    documentMapCatchTemplateInvalidNext,
    documentNestedNoTerminalState,
    documentNestedUnreachableState,
    documentNoTerminalState,
    documentParallelCatchTemplate,
    documentParallelCatchTemplateInvalidNext,
    documentParametersArray,
    documentParametersBoolean,
    documentParametersNull,
    documentParametersNumber,
    documentParametersString,
    documentStartAtInvalid,
    documentStartAtNestedInvalid,
    documentStartAtValid,
    documentSucceedFailTerminalState,
    documentTaskCatchTemplate,
    documentTaskCatchTemplateInvalidNext,
    documentTaskInvalidArn,
    documentTaskValidVariableSubstitution,
    documentUnreachableState,
    documentValidAslImprovements,
    documentValidNext,
    documentValidParametersIntrinsicFunction,
    documentValidParametersJsonPath,
    documentValidResultSelectorIntrinsicFunction,
    documentValidResultSelectorJsonPath
} from './yasl-strings/validationStrings'

import { Diagnostic, DiagnosticSeverity, Position, Range } from 'vscode-languageserver'
import { service as yamlService } from '../yaml'
import { toDocument } from './utils/testUtilities'

const JSON_SCHEMA_MULTIPLE_SCHEMAS_MSG = 'Matches multiple schemas when only one must validate.'

export interface TestValidationOptions {
    json: string
    diagnostics: {
        message: string
        start: [number, number]
        end: [number, number]
    }[]
    filterMessages?: string[]
}

async function getValidations(json: string) {
    const { textDoc } = toDocument(json, true)
    return await yamlService().diagnostic(textDoc)
}

async function testValidations(options: TestValidationOptions) {
    const { json, diagnostics, filterMessages } = options

    let res = await getValidations(json)
    res = res.filter((diagnostic: Diagnostic) => {
        if (filterMessages && filterMessages.find(message => message === diagnostic.message)) {
            return false
        }

        return true
    })

    assert.strictEqual(res.length, diagnostics.length)

    res.forEach((item, index) => {
        const leftPos = Position.create(...diagnostics[index].start)
        const rightPos = Position.create(...diagnostics[index].end)

        const diagnostic = Diagnostic.create(
            Range.create(leftPos, rightPos),
            diagnostics[index].message,
            DiagnosticSeverity.Error
        )

        assert.deepStrictEqual(diagnostic, item)
    })
}

suite('ASL YAML context-aware validation', () => {
    suite('Invalid YAML Input', () => {
        test("Empty string doesn't throw errors", async () => {
            await assert.doesNotReject(getValidations(''))
        })

        test("[] string doesn't throw type errors", async () => {
            await assert.doesNotReject(getValidations('[]'), TypeError)
        })

        test('Shows diagnostic for duplicate key', async () => {
            const message = YAML_PARSER_MESSAGES.DUPLICATE_KEY

            await testValidations({
                json: documentDuplicateKey,
                diagnostics: [
                    {
                        message,
                        start: [3, 2],
                        end: [3, 9]
                    },
                    {
                        message,
                        start: [1, 2],
                        end: [1, 9]
                    },
                    {
                        message,
                        start: [12, 4],
                        end: [12, 9]
                    },
                    {
                        message,
                        start: [9, 4],
                        end: [9, 9]
                    }
                ]
            })
        })
    })

    suite('Default of Choice state', () => {
        test('Shows diagnostic for invalid state name', async () => {
            await testValidations({
                json: documentChoiceInvalidDefault,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_DEFAULT,
                        start: [13, 15],
                        end: [13, 33]
                    },
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [18, 4],
                        end: [18, 16]
                    }
                ]
            })
        })

        test("Doesn't show Diagnostic for valid state name", async () => {
            await testValidations({
                json: documentChoiceValidDefault,
                diagnostics: []
            })
        })

        test("Doesn't show Diagnostic when default property is absent", async () => {
            await testValidations({
                json: documentChoiceNoDefault,
                diagnostics: []
            })
        })

        test("Doesn't show Diagnostic for valid state name when default state is declared before Choice state", async () => {
            await testValidations({
                json: documentChoiceDefaultBeforeChoice,
                diagnostics: []
            })
        })
    })

    suite('StartAt', () => {
        test("Shows Diagnostic for state name that doesn't exist", async () => {
            await testValidations({
                json: documentStartAtInvalid,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_START_AT,
                        start: [1, 11],
                        end: [1, 16]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })

        test("Doesn't show Diagnostic for valid state name", async () => {
            await testValidations({
                json: documentStartAtValid,
                diagnostics: []
            })
        })

        test("Shows Diagnostic for state name that doesn't exist in nested StartAt property", async () => {
            await testValidations({
                json: documentStartAtNestedInvalid,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_START_AT,
                        start: [7, 19],
                        end: [7, 22]
                    },
                    {
                        message: MESSAGES.INVALID_START_AT,
                        start: [21, 19],
                        end: [21, 23]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })
    })

    suite('Next', () => {
        test("Shows Diagnostic for state name that doesn't exist", async () => {
            await testValidations({
                json: documentInvalidNext,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [5, 12],
                        end: [5, 16]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })

        test("Doesn't show Diagnostic for valid state name", async () => {
            await testValidations({
                json: documentValidNext,
                diagnostics: [],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })

        test("Shows Diagnostic for state name that doesn't exist in nested Next property", async () => {
            await testValidations({
                json: documentInvalidNextNested,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [11, 20],
                        end: [11, 31]
                    },
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [31, 18],
                        end: [31, 29]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })

        test('Validates next property of the Choice state', async () => {
            await testValidations({
                json: documentChoiceInvalidNext,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [17, 24],
                        end: [17, 26]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, MESSAGES.NO_TERMINAL_STATE]
            })
        })
    })

    suite('Unreachable State', () => {
        test('Shows diagnostic for an unreachable state', async () => {
            await testValidations({
                json: documentUnreachableState,
                diagnostics: [
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [3, 4],
                        end: [3, 11]
                    },
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [12, 4],
                        end: [12, 14]
                    },
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [15, 4],
                        end: [15, 15]
                    }
                ],
                filterMessages: [MESSAGES.NO_TERMINAL_STATE, MESSAGES.INVALID_START_AT]
            })
        })

        test('Shows diagnostic for an unreachable state in nested list of states', async () => {
            await testValidations({
                json: documentNestedUnreachableState,
                diagnostics: [
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [12, 12],
                        end: [12, 18]
                    },
                    {
                        message: MESSAGES.UNREACHABLE_STATE,
                        start: [32, 10],
                        end: [32, 16]
                    }
                ],
                filterMessages: [MESSAGES.NO_TERMINAL_STATE]
            })
        })
    })

    suite('Terminal State', () => {
        test('Shows diagnostic for lack of terminal state', async () => {
            await testValidations({
                json: documentNoTerminalState,
                diagnostics: [
                    {
                        message: MESSAGES.NO_TERMINAL_STATE,
                        start: [2, 2],
                        end: [2, 8]
                    }
                ]
            })
        })

        test('Shows diagnostic for lack of terminal state in nested list of states', async () => {
            await testValidations({
                json: documentNestedNoTerminalState,
                diagnostics: [
                    {
                        message: MESSAGES.NO_TERMINAL_STATE,
                        start: [16, 10],
                        end: [16, 16]
                    },
                    {
                        message: MESSAGES.NO_TERMINAL_STATE,
                        start: [28, 8],
                        end: [28, 14]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })

        test('Accepts "Succeed" and "Fail" state as terminal states', async () => {
            await testValidations({
                json: documentSucceedFailTerminalState,
                diagnostics: []
            })
        })

        test('No terminal state error when state referenced from next property of Choice state within Parallel state', async () => {
            await testValidations({
                json: documentChoiceValidNext,
                diagnostics: []
            })
        })
    })

    suite('Catch property of "Parallel" and "Task" state', async () => {
        test('Does not show diagnostic on valid next property within Catch block of Task state', async () => {
            await testValidations({
                json: documentTaskCatchTemplate,
                diagnostics: []
            })
        })

        test('Does not show diagnostic on valid next property within Catch block of Parallel state', async () => {
            await testValidations({
                json: documentParallelCatchTemplate,
                diagnostics: []
            })
        })

        test('Does not show diagnostic on valid next property within Catch block of Map state', async () => {
            await testValidations({
                json: documentMapCatchTemplate,
                diagnostics: []
            })
        })

        test('Shows diagnostics on invalid next property within Catch block of Task state', async () => {
            await testValidations({
                json: documentTaskCatchTemplateInvalidNext,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [13, 18],
                        end: [13, 30]
                    },
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [16, 18],
                        end: [16, 34]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })

        test('Shows diagnostics on invalid next property within Catch block of Parallel', async () => {
            await testValidations({
                json: documentParallelCatchTemplateInvalidNext,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [9, 16],
                        end: [9, 24]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })

        test('Shows diagnostics on invalid next property within Catch block of Map', async () => {
            await testValidations({
                json: documentMapCatchTemplateInvalidNext,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [19, 16],
                        end: [19, 23]
                    },
                    {
                        message: MESSAGES.INVALID_NEXT,
                        start: [25, 16],
                        end: [25, 24]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })
    })

    suite('Additional properties that are not valid', async () => {
        test('Shows diagnostics for additional invalid properties of a given state', async () => {
            await testValidations({
                json: documentInvalidPropertiesState,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [7, 6],
                        end: [7, 23]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [8, 6],
                        end: [8, 23]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })

        test('Shows diagnostics for additional invalid properties within Catch block', async () => {
            await testValidations({
                json: documentInvalidPropertiesCatch,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [10, 8],
                        end: [10, 18]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [14, 8],
                        end: [14, 18]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [15, 8],
                        end: [15, 20]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE]
            })
        })

        test('Shows diagnostics for additional invalid properties within Choice state', async () => {
            await testValidations({
                json: documentInvalidPropertiesChoices,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [15, 8],
                        end: [15, 24]
                    },
                    {
                        message: MESSAGES.MUTUALLY_EXCLUSIVE_CHOICE_PROPERTIES,
                        start: [13, 8],
                        end: [13, 20]
                    },
                    {
                        message: MESSAGES.MUTUALLY_EXCLUSIVE_CHOICE_PROPERTIES,
                        start: [14, 8],
                        end: [14, 32]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [21, 10],
                        end: [21, 27]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [22, 10],
                        end: [22, 14]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [26, 10],
                        end: [26, 26]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [27, 10],
                        end: [27, 14]
                    },
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [32, 8],
                        end: [32, 12]
                    }
                ],
                filterMessages: [MESSAGES.UNREACHABLE_STATE, JSON_SCHEMA_MULTIPLE_SCHEMAS_MSG]
            })
        })

        test('Shows diagnostics for additional invalid properties within root of state machine', async () => {
            await testValidations({
                json: documentInvalidPropertiesRoot,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [5, 2],
                        end: [5, 18]
                    }
                ]
            })
        })

        test('Shows diagnostics for additional invalid properties within root of nested state machine', async () => {
            await testValidations({
                json: documentInvalidPropertiesRootNested,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_PROPERTY_NAME,
                        start: [10, 8],
                        end: [10, 19]
                    }
                ]
            })
        })
    })

    suite('Test validation of Resource arn for Task State', async () => {
        test('Does not show diagnostic on invalid arn', async () => {
            await testValidations({
                json: documentTaskInvalidArn,
                diagnostics: []
            })
        })

        test('Does not show diagnostic on valid variable substitution', async () => {
            await testValidations({
                json: documentTaskValidVariableSubstitution,
                diagnostics: []
            })
        })
    })

    suite('Test validation of Properties field', async () => {
        test('Does not show diagnostics for valid JSON paths', async () => {
            await testValidations({
                json: documentValidParametersJsonPath,
                diagnostics: []
            })
        })

        test('Does not show diagnostics for valid Intrinsic Functions', async () => {
            await testValidations({
                json: documentValidParametersIntrinsicFunction,
                diagnostics: []
            })
        })

        test('Does not show diagnostics for Parameters array', async () => {
            await testValidations({
                json: documentParametersArray,
                diagnostics: []
            })
        })

        test('Does not show diagnostics for Parameters boolean', async () => {
            await testValidations({
                json: documentParametersBoolean,
                diagnostics: []
            })
        })

        test('Does not show diagnostics for Parameters null', async () => {
            await testValidations({
                json: documentParametersNull,
                diagnostics: []
            })
        })

        test('Does not show diagnostics for Parameters number', async () => {
            await testValidations({
                json: documentParametersNumber,
                diagnostics: []
            })
        })

        test('Does not show diagnostics for Parameters string', async () => {
            await testValidations({
                json: documentParametersString,
                diagnostics: []
            })
        })

        test('Shows diagnostics for invalid JSON paths', async () => {
            await testValidations({
                json: documentInvalidParametersJsonPath,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [9, 18],
                        end: [9, 18]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [12, 28],
                        end: [12, 30]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [13, 28],
                        end: [13, 32]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [14, 21],
                        end: [14, 28]
                    }
                ]
            })
        })

        test('Shows diagnostics for invalid Intrinsic Functions', async () => {
            await testValidations({
                json: documentInvalidParametersIntrinsicFunction,
                diagnostics: [
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [9, 20],
                        end: [9, 72]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [10, 20],
                        end: [10, 43]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [11, 20],
                        end: [11, 52]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [12, 20],
                        end: [12, 30]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [13, 20],
                        end: [13, 37]
                    },
                    {
                        message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                        start: [14, 20],
                        end: [14, 38]
                    }
                ]
            })
        })
    })

    suite('ASL Improvements', async () => {
        test('Does not show diagnostics for valid document containing ASL Improvements', async () => {
            await testValidations({
                json: documentValidAslImprovements,
                diagnostics: []
            })
        })

        suite('Test validation of ResultSelector field', async () => {
            test('Does not show diagnostics for valid JSON paths', async () => {
                await testValidations({
                    json: documentValidResultSelectorJsonPath,
                    diagnostics: []
                })
            })

            test('Does not show diagnostics for valid Intrinsic Functions', async () => {
                await testValidations({
                    json: documentValidResultSelectorIntrinsicFunction,
                    diagnostics: []
                })
            })

            test('Shows diagnostics for invalid JSON paths', async () => {
                await testValidations({
                    json: documentInvalidResultSelectorJsonPath,
                    diagnostics: [
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [9, 18],
                            end: [9, 18]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [12, 28],
                            end: [12, 30]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [13, 28],
                            end: [13, 32]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [14, 21],
                            end: [14, 28]
                        }
                    ]
                })
            })

            test('Shows diagnostics for invalid Intrinsic Functions', async () => {
                await testValidations({
                    json: documentInvalidResultSelectorIntrinsicFunction,
                    diagnostics: [
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [9, 20],
                            end: [9, 72]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [10, 20],
                            end: [10, 43]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [11, 20],
                            end: [11, 52]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [12, 20],
                            end: [12, 30]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [13, 20],
                            end: [13, 37]
                        },
                        {
                            message: MESSAGES.INVALID_JSON_PATH_OR_INTRINSIC,
                            start: [14, 20],
                            end: [14, 39]
                        }
                    ]
                })
            })
        })
    })
})
