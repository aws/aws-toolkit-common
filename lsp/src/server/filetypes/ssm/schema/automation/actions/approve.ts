/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const approveInputs: JSONSchema = {
    properties: {
        inputs: {
            properties: {
                NotificationArn: {
                    description:
                        'The ARN of an Amazon SNS topic for Automation approvals. When you specify an aws:approve step in an Automation document, Automation sends a message to this topic letting principals know that they must either approve or reject an Automation step. The title of the Amazon SNS topic must be prefixed with "Automation".',
                    type: 'string'
                },
                Message: {
                    description:
                        'The information you want to include in the SNS topic when the approval request is sent. The maximum message length is 4096 characters.',
                    type: 'string'
                },
                MinRequiredApprovals: {
                    description:
                        "The minimum number of approvals required to resume the Automation execution. If you don't specify a value, the system defaults to one. The value for this parameter must be a positive number. The value for this parameter can't exceed the number of approvers defined by the Approvers parameter.",
                    type: ['string', 'integer']
                },
                Approvers: {
                    description:
                        'A list of AWS authenticated principals who are able to either approve or reject the action. The maximum number of approvers is 10. You can specify principals by using any of the following formats:\n\nAn AWS Identity and Access Management (IAM) user name\n\nAn IAM user ARN\n\nAn IAM role ARN\n\nAn IAM assume role user ARN',
                    type: ['string', 'array'],
                    items: {
                        type: 'string'
                    }
                }
            },
            required: ['Approvers']
        }
    },
    required: ['inputs']
}

export const approveSnippet: SnippetDefinition = {
    label: 'Snippet: aws:approve',
    description:
        'Temporarily pauses an Automation execution until designated principals either approve or reject the action. After the required number of approvals is reached, the Automation execution resumes. You can insert the approval step any place in the mainSteps section of your Automation document.',
    body: {
        name: '${1:approve}',
        action: 'aws:approve',
        inputs: {
            NotificationArn: 'arn:aws:sns:us-east-2:12345678901:AutomationApproval',
            Message: 'Please approve this step of the Automation.',
            MinRequiredApprovals: 3,
            Approvers: [
                'IamUser1',
                'IamUser2',
                'arn:aws:iam::12345678901:user/IamUser3',
                'arn:aws:iam::12345678901:role/IamRole'
            ]
        }
    }
}
