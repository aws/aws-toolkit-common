/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const executeStateMachineInputs: JSONSchema = {
    description: 'Run an AWS Step Functions state machine.',
    properties: {
        inputs: {
            properties: {
                stateMachineArn: {
                    description: 'The ARN of the Step Functions state machine.',
                    type: 'string'
                },
                name: {
                    description: 'The name of the execution.',
                    type: 'string'
                },
                input: {
                    description: 'A string that contains the JSON input data for the execution.',
                    type: 'string'
                }
            },
            required: ['stateMachineArn']
        }
    }
}

export const executeStateMachineSnippet: SnippetDefinition = {
    label: 'Snippet: aws:executeStateMachine',
    description: 'Run an AWS Step Functions state machine.',
    body: {
        name: '${1:executeStateMachine}',
        action: 'aws:executeStateMachine',
        inputs: {
            stateMachineArn: 'StateMachine_ARN',
            input: '{"parameters":"values"}',
            name: 'name'
        }
    }
}
