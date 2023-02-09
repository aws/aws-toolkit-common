/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const createImageInputs: JSONSchema = {
    description: 'Creates a new AMI from an instance that is either running or stopped.',
    properties: {
        inputs: {
            properties: {
                InstanceId: {
                    description: 'The ID of the instance.',
                    type: 'string'
                },
                ImageName: {
                    description: 'The name for the image.',
                    type: 'string'
                },
                ImageDescription: {
                    description: 'A description of the image.',
                    type: 'string'
                },
                NoReboot: {
                    description:
                        "A boolean literal.\n\nBy default, Amazon EC2 attempts to shut down and reboot the instance before creating the image. If the No Reboot option is set to true, Amazon EC2 doesn't shut down the instance before creating the image. When this option is used, file system integrity on the created image can't be guaranteed.\n\nIf you do not want the instance to run after you create an AMI image from it, first use the aws:changeInstanceState – Change or assert instance state action to stop the instance, and then use this aws:createImage action with the NoReboot option set to true.",
                    type: ['string', 'boolean']
                },
                BlockDeviceMappings: {
                    description: 'The block devices for the intance.',
                    type: ['string', 'object']
                }
            },
            required: ['InstanceId', 'ImageName']
        }
    }
}

export const createImageSnippet: SnippetDefinition = {
    label: 'Snippet: aws:createImage',
    description: 'Creates a new AMI from an instance that is either running or stopped.',
    body: {
        name: '${1:createImage}',
        action: 'aws:createImage',
        maxAttempts: 3,
        onFailure: 'Abort',
        inputs: {
            InstanceId: 'i-1234567890abcdef0',
            ImageName: 'AMI Created on{{global:DATE_TIME}}',
            NoReboot: true,
            ImageDescription: 'My newly created AMI'
        }
    }
}
