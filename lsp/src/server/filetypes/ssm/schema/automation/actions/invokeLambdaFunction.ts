/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const invokeLambdaFunctionInputs: JSONSchema = {
    description: 'Invokes the specified Lambda function.',
    properties: {
        inputs: {
            properties: {
                FunctionName: {
                    description: 'The name of the Lambda function. This function must exist.',
                    type: 'string'
                },
                Qualifier: {
                    description: 'The function version or alias name.',
                    type: 'string'
                },
                InvocationType: {
                    description: 'The invocation type. The default is RequestResponse.',
                    type: 'string',
                    oneOf: [
                        {
                            enum: ['Event', 'RequestResponse', 'DryRun']
                        },
                        {
                            pattern: '^{{[ ]{0,1}[a-zA-Z_.]+[ ]{0,1}}}$'
                        }
                    ]
                },
                LogType: {
                    description:
                        'If Tail, the invocation type must be RequestResponse. AWS Lambda returns the last 4 KB of log data produced by your Lambda function, base64-encoded.',
                    type: 'string',
                    oneOf: [
                        {
                            enum: ['None', 'Tail']
                        },
                        {
                            pattern: '^{{[ ]{0,1}[a-zA-Z_.]+[ ]{0,1}}}$'
                        }
                    ]
                },
                ClientContext: {
                    description: 'The client-specific information.'
                },
                Payload: {
                    description: 'The JSON input for your lambda function.'
                }
            },
            required: ['FunctionName']
        }
    }
}

export const invokeLambdaFunctionSnippet: SnippetDefinition = {
    label: 'Snippet: aws:invokeLambdaFunction',
    description: 'Invokes the specified Lambda function.',
    body: {
        name: '${1:invokeLambdaFunction}',
        action: 'aws:invokeLambdaFunction',
        maxAttempts: 3,
        timeoutSeconds: 120,
        onFailure: 'Abort',
        inputs: {
            FunctionName: 'MyLambdaFunction'
        }
    }
}
