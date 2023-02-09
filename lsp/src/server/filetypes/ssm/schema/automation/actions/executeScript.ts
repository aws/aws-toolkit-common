/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

export const executeScriptInputs: JSONSchema = {
    description:
        'Runs the Python or PowerShell script provided, using the specified runtime and handler. (For PowerShell, the handler is not required.)\n\nCurrently, the aws:executeScript action contains the following preinstalled PowerShell Core modules.\n\n\tMicrosoft.PowerShell.Host\n\n\tMicrosoft.PowerShell.Management\n\n\tMicrosoft.PowerShell.Security\n\n\tMicrosoft.PowerShell.Utility\n\n\tPackageManagement\n\n\tPowerShellGet',
    properties: {
        inputs: {
            properties: {
                Runtime: {
                    description:
                        'The runtime language to be used for executing the provided script. Currently, aws:executeScript supports Python 3.6 (python3.6), Python 3.7 (python3.7), Python 3.8 (python3.8), PowerShell Core 6.0 (dotnetcore2.1), and PowerShell 7.0 (dotnetcore3.1) scripts.',
                    type: 'string',
                    oneOf: [
                        {
                            enum: ['python3.6', 'python3.7', 'python3.8', 'PowerShell Core 6.0', 'PowerShell 7.0']
                        },
                        {
                            pattern: '^{{[ ]{0,1}[a-zA-Z_.]+[ ]{0,1}}}$'
                        }
                    ]
                },
                Handler: {
                    description:
                        'The entry for script execution, usually a function name. You must ensure the function defined in the handler has two parameters, events and context. (Not required for PowerShell.)',
                    type: 'string'
                },
                InputPayload: {
                    description:
                        'A JSON or YAML object that will be passed to the first parameter of the handler. This can be used to pass input data to the script.',
                    type: ['string', 'object']
                },
                Script: {
                    description:
                        'An embedded script that you want to run during the automation execution. (Not supported for JSON documents.)',
                    type: ['string']
                },
                Attachment: {
                    description:
                        'The name of a standalone script file or .zip file that can be invoked by the action. To invoke a file for python, use the filename.method_name format in Handler. For PowerShell, invoke the attachment using and inline script. Gzip is not supported.',
                    type: 'string'
                }
            },
            required: ['Runtime']
        }
    }
}

const pythonScript = `def handler(events, context):
    param1 = events['parameter1']
    param2 = events['parameter2']
    print(param1, param2, sep='\\n')
    return {
        'Message': 'Hello World'
    }`

export const executeScriptPythonSnippet: SnippetDefinition = {
    label: 'Snippet: aws:executeScript using Python',
    description: 'Runs the Python script provided, using the specified runtime and handler.',
    body: {
        name: '${1:executePythonScript}',
        action: 'aws:executeScript',
        inputs: {
            Runtime: 'python3.7',
            InputPayload: {
                parameter1: 'parameter_value1',
                parameter2: 'parameter_value2'
            },
            Handler: 'handler',
            Script: pythonScript
        },
        outputs: [
            {
                Name: 'Message',
                Selector: '$.Payload.Message',
                Type: 'String'
            }
        ]
    }
}

const powershellScript = `Write-Host 'hello world';
\\$inputPayload = $env:InputPayload | ConvertFrom-Json;
\\$param1 = \\$inputPayload.parameter1;
\\$param2 = \\$inputPayload.parameter2;
Write-Host \\$param1;
Write-Host \\$param2;
return @\\{Message="Hello World"\\}
`

export const executeScriptPowershellSnippet: SnippetDefinition = {
    label: 'Snippet: aws:executeScript using Powershell',
    description:
        'Runs the PowerShell script provided, using the specified runtime.\n\nCurrently, the aws:executeScript action contains the following preinstalled PowerShell Core modules.\n\n\tMicrosoft.PowerShell.Host\n\n\tMicrosoft.PowerShell.Management\n\n\tMicrosoft.PowerShell.Security\n\n\tMicrosoft.PowerShell.Utility\n\n\tPackageManagement\n\n\tPowerShellGet',
    body: {
        name: '${1:executePowershellScript}',
        action: 'aws:executeScript',
        inputs: {
            Runtime: 'PowerShell Core 6.0',
            InputPayload: {
                parameter1: 'parameter_value1',
                parameter2: 'parameter_value2'
            },
            Script: powershellScript
        },
        outputs: [
            {
                Name: 'Message',
                Selector: '$.Payload.Message',
                Type: 'String'
            }
        ]
    }
}
