/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const createTagsInputs: JSONSchema = {
    description: 'Create new tags for EC2 instances or Systems Manager managed instances.',
    properties: {
        inputs: {
            properties: {
                ResourceIds: {
                    description:
                        'The IDs of the resource(s) to be tagged. If resource type is not “EC2”, this field can contain only a single item.',
                    type: ['string', 'array'],
                    items: {
                        type: 'string'
                    }
                },
                Tags: {
                    description: 'The tags to associate with resource(s).',
                    type: ['string', 'array'],
                    items: {
                        type: 'object'
                    }
                },
                ResourceType: {
                    description:
                        'The type of resource(s) to be tagged. If not supplied, the default value of “EC2” is used.',
                    type: 'string',
                    oneOf: [
                        {
                            enum: ['EC2', 'ManagedInstance', 'MaintenanceWindow', 'Parameter']
                        },
                        {
                            pattern: '^{{[ ]{0,1}[a-zA-Z_.]+[ ]{0,1}}}$'
                        }
                    ]
                }
            },
            required: ['ResourceIds', 'Tags']
        }
    }
}

export const createTagsSnippet: SnippetDefinition = {
    label: 'Snippet: aws:createTags',
    description: 'Create new tags for EC2 instances or Systems Manager managed instances.',
    body: {
        name: '${1:createTags}',
        action: 'aws:createTags',
        maxAttempts: 3,
        onFailure: 'Abort',
        inputs: {
            ResourceType: 'EC2',
            ResourceIds: ['ami-9a3768fa', 'i-02951acd5111a8169'],
            Tags: [
                {
                    Key: 'production',
                    Value: ''
                },
                {
                    Key: 'department',
                    Value: 'devops'
                }
            ]
        }
    }
}
