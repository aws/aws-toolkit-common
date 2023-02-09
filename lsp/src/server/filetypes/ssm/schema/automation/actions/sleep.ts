/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const sleepInputs: JSONSchema = {
    description:
        'Delays Automation execution for a specified amount of time. This action uses the International Organization for Standardization (ISO) 8601 date and time format.\n\nAutomation currently supports a maximum delay of 604800 seconds (7 days).',
    properties: {
        inputs: {
            properties: {
                Duration: {
                    description: "An ISO 8601 duration. You can't specify a negative duration.",
                    type: 'string'
                },
                TimeStamp: {
                    description:
                        "An ISO 8601 timestamp. If you don't specify a value for this parameter, then you must specify a value for the Duration parameter.",
                    type: 'string'
                }
            }
        }
    }
}

export const sleepSnippet: SnippetDefinition = {
    label: 'Snippet: aws:sleep',
    description:
        'Delays Automation execution for a specified amount of time. This action uses the International Organization for Standardization (ISO) 8601 date and time format.\n\nAutomation currently supports a maximum delay of 604800 seconds (7 days).',
    body: {
        name: '${1:sleep}',
        action: 'aws:sleep',
        inputs: {
            Duration: 'PT10M'
        }
    }
}
