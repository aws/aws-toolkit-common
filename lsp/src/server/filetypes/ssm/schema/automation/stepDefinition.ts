/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { approveInputs, approveSnippet } from './actions/approve'
import { assertAwsResourcePropertyInputs, assertAwsResourcePropertySnippet } from './actions/assertAwsResourceProperty'
import { branchInputs, branchSnippet } from './actions/branch'
import { changeInstanceStateInputs, changeInstanceStateSnippet } from './actions/changeInstanceState'
import { copyImageInputs, copyImageSnippet } from './actions/copyImage'
import { createImageInputs, createImageSnippet } from './actions/createImage'
import { createStackInputs, createStackSnippet } from './actions/createStack'
import { createTagsInputs, createTagsSnippet } from './actions/createTags'
import { deleteImageInputs, deleteImageSnippet } from './actions/deleteImage'
import { deleteStackInputs, deleteStackSnippet } from './actions/deleteStack'
import { executeAutomationInputs, executeAutomationSnippet } from './actions/executeAutomation'
import { executeAwsApiInputs, executeAwsApiSnippet } from './actions/executeAwsApi'
import {
    executeScriptInputs,
    executeScriptPowershellSnippet,
    executeScriptPythonSnippet
} from './actions/executeScript'
import { executeStateMachineInputs, executeStateMachineSnippet } from './actions/executeStateMachine'
import { invokeLambdaFunctionInputs, invokeLambdaFunctionSnippet } from './actions/invokeLambdaFunction'
import { pauseInputs, pauseSnippet } from './actions/pause'
import { runCommandInputs, runCommandSnippet } from './actions/runCommand'
import { runInstancesInputs, runInstancesSnippet } from './actions/runInstances'
import { sleepInputs, sleepSnippet } from './actions/sleep'
import {
    waitForAwsResourcePropertyInputs,
    waitForAwsResourcePropertySnippet
} from './actions/waitForAwsResourceProperty'

export const stepDefinition: JSONSchema = {
    type: 'object',
    required: ['name', 'action', 'inputs'],
    additionalProperties: false,
    properties: {
        name: {
            description: 'An identifier that must be unique across all step names in the document.',
            type: 'string'
        },
        action: {
            description: 'Select the Automation action type to run in this step.',
            type: 'string',
            enum: [
                'aws:approve',
                'aws:assertAwsResourceProperty',
                'aws:branch',
                'aws:changeInstanceState',
                'aws:copyImage',
                'aws:createImage',
                'aws:createStack',
                'aws:createTags',
                'aws:deleteImage',
                'aws:deleteStack',
                'aws:executeAutomation',
                'aws:executeAwsApi',
                'aws:executeScript',
                'aws:executeStateMachine',
                'aws:invokeLambdaFunction',
                'aws:pause',
                'aws:runCommand',
                'aws:runInstances',
                'aws:sleep',
                'aws:waitForAwsResourceProperty'
            ]
        },
        description: {
            description: 'Enter information to describe the purpose or usage of this step.',
            type: 'string'
        },
        maxAttempts: {
            description:
                'The number of times the step should be retried in case of failure. If the value is greater than 1, the step is not considered to have failed until all retry attempts have failed. The default value is 1.',
            type: 'integer',
            default: 1
        },
        timeoutSeconds: {
            type: ['integer', 'string'],
            description:
                'The execution timeout value for the step. If the timeout is reached and the value of maxAttempts is greater than 1, then the step is not considered to have timed out until all retries have been attempted.'
        },
        onFailure: {
            description:
                'Indicates whether the workflow should abort, continue, or go to a different step on failure. The default value for this option is abort.',
            type: 'string',
            pattern: '((^|, )(Abort|Continue|step:\\w+))$',
            default: 'Abort'
        },
        nextStep: {
            description:
                'Specifies which step in an Automation workflow to process next after successfully completing a step.',
            type: 'string'
        },
        isEnd: {
            description:
                'This option stops an Automation execution at the end of a specific step. The Automation execution stops if the step execution failed or succeeded. The default value is false.',
            type: ['string', 'boolean'],
            default: false
        },
        isCritical: {
            description:
                'Designates a step as critical for the successful completion of the Automation. If a step with this designation fails, then Automation reports the final status of the Automation as Failed. This property is only evaluated if you explicitly define it in your step. The default value for this option is true.',
            type: ['string', 'boolean'],
            default: true
        },
        inputs: {
            description: 'The properties specific to the action.',
            type: 'object'
        },
        outputs: {
            description: 'Define new outputs for a step that can be referenced from other steps.',
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    Name: {
                        description: 'Output variable name.',
                        type: 'string'
                    },
                    Selector: {
                        description: 'JSONPath to select the value from the action output.',
                        type: 'string'
                    },
                    Type: {
                        description: 'Output variable type.',
                        type: 'string',
                        enum: ['String', 'StringList', 'Boolean', 'Integer', 'MapList', 'StringMap']
                    }
                }
            }
        }
    },
    allOf: [
        {
            if: {
                properties: { action: { const: 'aws:approve' } }
            },
            then: approveInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:assertAwsResourceProperty' } }
            },
            then: assertAwsResourcePropertyInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:branch' } }
            },
            then: branchInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:changeInstanceState' } }
            },
            then: changeInstanceStateInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:copyImage' } }
            },
            then: copyImageInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:createImage' } }
            },
            then: createImageInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:createStack' } }
            },
            then: createStackInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:createTags' } }
            },
            then: createTagsInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:deleteImage' } }
            },
            then: deleteImageInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:deleteStack' } }
            },
            then: deleteStackInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:executeAutomation' } }
            },
            then: executeAutomationInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:executeAwsApi' } }
            },
            then: executeAwsApiInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:executeScript' } }
            },
            then: executeScriptInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:executeStateMachine' } }
            },
            then: executeStateMachineInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:invokeLambdaFunction' } }
            },
            then: invokeLambdaFunctionInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:pause' } }
            },
            then: pauseInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:runCommand' } }
            },
            then: runCommandInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:runInstances' } }
            },
            then: runInstancesInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:sleep' } }
            },
            then: sleepInputs
        },
        {
            if: {
                properties: { action: { const: 'aws:waitForAwsResourceProperties' } }
            },
            then: waitForAwsResourcePropertyInputs
        }
    ],
    defaultSnippets: [
        approveSnippet,
        assertAwsResourcePropertySnippet,
        branchSnippet,
        changeInstanceStateSnippet,
        copyImageSnippet,
        createImageSnippet,
        createStackSnippet,
        createTagsSnippet,
        deleteImageSnippet,
        deleteStackSnippet,
        executeAutomationSnippet,
        executeAwsApiSnippet,
        executeScriptPythonSnippet,
        executeScriptPowershellSnippet,
        executeStateMachineSnippet,
        invokeLambdaFunctionSnippet,
        pauseSnippet,
        runCommandSnippet,
        runInstancesSnippet,
        sleepSnippet,
        waitForAwsResourcePropertySnippet
    ]
}
