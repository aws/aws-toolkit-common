/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const pauseInputs: JSONSchema = {
    description:
        'This action pauses the Automation execution. Once paused, the execution status is Waiting. To continue the Automation execution, use the SendAutomationSignal API action with the Resume signal type.'
}

export const pauseSnippet: SnippetDefinition = {
    label: 'Snippet: aws:pause',
    description:
        'This action pauses the Automation execution. Once paused, the execution status is Waiting. To continue the Automation execution, use the SendAutomationSignal API action with the Resume signal type.',
    body: {
        name: '${1:pause}',
        action: 'aws:pause',
        inputs: {}
    }
}
