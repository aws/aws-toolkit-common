/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const deleteImageInputs: JSONSchema = {
    description: 'Deletes the specified image and all related snapshots.',
    properties: {
        inputs: {
            properties: {
                ImageId: {
                    description: 'The ID of the image to be deleted.',
                    type: 'string'
                }
            },
            required: ['ImageId']
        }
    }
}

export const deleteImageSnippet: SnippetDefinition = {
    label: 'Snippet: aws:deleteImage',
    description: 'Deletes the specified image and all related snapshots.',
    body: {
        name: '${1:deleteImage}',
        action: 'aws:deleteImage',
        maxAttempts: 3,
        timeoutSeconds: 180,
        onFailure: 'Abort',
        inputs: {
            ImageId: 'ami-12345678'
        }
    }
}
