/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const executeAwsApiInputs: JSONSchema = {
    description:
        'Calls and runs AWS API actions. Most API actions are supported, although not all API actions have been tested.',
    properties: {
        inputs: {
            properties: {
                Service: {
                    description: 'The AWS service namespace that contains the API action that you want to run.',
                    type: 'string'
                },
                Api: {
                    description: 'The name of the API action that you want to run.',
                    type: 'string'
                }
            },
            additionalProperties: true,
            required: ['Service']
        }
    }
}

export const executeAwsApiSnippet: SnippetDefinition = {
    label: 'Snippet: aws:executeAwsApi',
    description:
        'Calls and runs AWS API actions. Most API actions are supported, although not all API actions have been tested.',
    body: {
        name: '${1:executeAwsApi}',
        action: 'aws:executeAwsApi',
        inputs: {
            Service: 'The official namespace of the service',
            Api: 'The API action or method name',
            'API action inputs or parameters': 'A value'
        },
        outputs: [
            {
                Name: 'The name for a user-specified output key',
                Selector: 'A response object specified by using JSONPath format',
                Type: 'The data type'
            }
        ]
    }
}
