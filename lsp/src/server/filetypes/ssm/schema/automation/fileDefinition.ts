/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'

const sha256Definition = {
    type: 'string',
    description: 'SHA256 hash of the attachment content',
    minLength: 64,
    maxLength: 64,
    pattern: '[A-Fa-f0-9]{64}'
}

export const fileDefinition: JSONSchema = {
    type: 'object',
    description: 'Attachment definition.',
    required: ['checksums'],
    properties: {
        checksums: {
            type: 'object',
            description: 'Checksums of the attachment.',
            oneOf: [
                {
                    required: ['sha256'],
                    properties: {
                        sha256: sha256Definition
                    },
                    additionalProperties: false
                },
                {
                    required: ['SHA256'],
                    properties: {
                        SHA256: sha256Definition
                    },
                    additionalProperties: false
                },
                {
                    required: ['sha-256'],
                    properties: {
                        'sha-256': sha256Definition
                    },
                    additionalProperties: false
                },
                {
                    required: ['SHA-256'],
                    properties: {
                        'SHA-256': sha256Definition
                    },
                    additionalProperties: false
                }
            ]
        },
        size: {
            description: 'Attachment size.',
            type: 'integer'
        }
    },
    additionalProperties: false
}
