/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const waitForAwsResourcePropertyInputs: JSONSchema = {
    description:
        'The aws:waitForAwsResourceProperty action enables your Automation workflow to wait for a specific resource state or event state before continuing the workflow.',
    properties: {
        inputs: {
            properties: {
                Service: {
                    description:
                        'The AWS service namespace that contains the API action that you want to run. For example, the namespace for Systems Manager is ssm. The namespace for Amazon EC2 is ec2.',
                    type: 'string'
                },
                Api: {
                    description: 'The name of the API action that you want to run.',
                    type: 'string'
                },
                PropertySelector: {
                    description: 'The JSONPath to a specific attribute in the response object.'
                },
                DesiredValues: {
                    description: 'The expected status or state on which to continue the Automation workflow.'
                }
            },
            additionalProperties: true,
            required: ['Service', 'Api', 'PropertySelector', 'DesiredValues']
        }
    }
}

export const waitForAwsResourcePropertySnippet: SnippetDefinition = {
    label: 'Snippet: aws:waitForAwsResourceProperty',
    description:
        'The aws:waitForAwsResourceProperty action enables your Automation workflow to wait for a specific resource state or event state before continuing the workflow.',
    body: {
        name: '${1:waitForAwsResourceProperty}',
        action: 'aws:waitForAwsResourceProperty',
        inputs: {
            Service: 'The official namespace of the service',
            Api: 'The API action or method name',
            'API action inputs or parameters': 'A value',
            PropertySelector: 'Response object',
            DesiredValues: ['Desired property value']
        }
    }
}
