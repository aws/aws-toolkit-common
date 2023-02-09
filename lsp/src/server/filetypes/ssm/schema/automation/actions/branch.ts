/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'
import { SnippetDefinition } from '../../interfaces'

const simpleCondition: JSONSchema = {
    description: 'Criteria used to evaluate choice',
    type: 'object',
    oneOf: [
        {
            properties: {
                StringEquals: {
                    description: 'Criteria used to evaluate choice',
                    type: 'string'
                }
            }
        },
        {
            properties: {
                EqualsIgnoreCase: {
                    description: 'Criteria used to evaluate choice',
                    type: 'string'
                }
            }
        },
        {
            properties: {
                StartsWith: {
                    description: 'Criteria used to evaluate choice',
                    type: 'string'
                }
            }
        },
        {
            properties: {
                EndsWith: {
                    description: 'Criteria used to evaluate choice',
                    type: 'string'
                }
            }
        },
        {
            properties: {
                Contains: {
                    description: 'Criteria used to evaluate choice',
                    type: 'string'
                }
            }
        },
        {
            properties: {
                NumericEquals: {
                    description: 'Criteria used to evaluate choice',
                    type: 'number'
                }
            }
        },
        {
            properties: {
                NumericGreater: {
                    description: 'Criteria used to evaluate choice',
                    type: 'number'
                }
            }
        },
        {
            properties: {
                NumericLesser: {
                    description: 'Criteria used to evaluate choice',
                    type: 'number'
                }
            }
        },
        {
            properties: {
                NumericGreaterOrEquals: {
                    description: 'Criteria used to evaluate choice',
                    type: 'number'
                }
            }
        },
        {
            properties: {
                NumericLesserOrEquals: {
                    description: 'Criteria used to evaluate choice',
                    type: 'number'
                }
            }
        },
        {
            properties: {
                BooleanEquals: {
                    description: 'Criteria used to evaluate choice',
                    type: 'boolean'
                }
            }
        }
    ]
}

const simpleConditional: JSONSchema = {
    properties: {
        Variable: {
            description:
                'Specify either the name of a parameter that is defined in the Parameters section of the Automation document. Or specify an output object from a previous step in the Automation document.',
            type: 'string'
        },
        simpleCondition
    }
}

const complexConditional: JSONSchema = {
    type: 'object',
    oneOf: [
        {
            type: 'object',
            properties: {
                And: {
                    description: 'Use the And operator when you want multiple variables to be true for a choice',
                    properties: {
                        items: {
                            type: 'object',
                            properties: {
                                simpleConditional
                            }
                        }
                    }
                }
            }
        },
        {
            type: 'object',
            properties: {
                Or: {
                    description: 'Use the Or operator when you want any of multiple variables to be true for a choice.',
                    properties: {
                        items: {
                            type: 'object',
                            properties: {
                                simpleConditional
                            }
                        }
                    }
                }
            }
        },
        {
            type: 'object',
            properties: {
                Not: {
                    description:
                        'Use the Not operator when you want to jump to a step defined when a variable is not true',
                    properties: {
                        simpleConditional
                    }
                }
            }
        }
    ]
}

const branchConditional: JSONSchema = {
    type: 'object',
    oneOf: [simpleConditional, complexConditional]
}

export const branchInputs: JSONSchema = {
    description:
        'The aws:branch action enables you to create a dynamic Automation workflow that evaluates different choices in a single step and then jumps to a different step in the Automation document based on the results of that evaluation. \n\nWhen you specify the aws:branch action for a step, you specify Choices that the workflow must evaluate. The Choices can be based on either a value that you specified in the Parameters section of the Automation document, or a dynamic value generated as the output from the previous step. The Automation workflow evaluates each choice by using a Boolean expression. If the first choice is true, then the workflow jumps to the step designated for that choice. If the first choice is false, the workflow evaluates the next choice. The workflow continues evaluating each choice until it process a true choice. The workflow then jumps to the designated step for the true choice. \n\nIf none of the choices are true, the workflow checks to see if the step contains a default value. A default value defines a step that the workflow should jump to if none of the choices are true. If no default value is specified for the step, then the Automation workflow processes the next step in the document.\n\nThe aws:branch action supports complex choice evaluations by using a combination of And, Not, and Or operators.',
    properties: {
        inputs: {
            properties: {
                Choices: {
                    description:
                        'One or more expressions that the Automation should evaluate when determining the next step to process. Choices are evaluated by using a Boolean expression.',
                    type: 'array',
                    items: [
                        {
                            type: 'object',
                            properties: {
                                branchConditional,
                                NextStep: {
                                    description:
                                        'The next step in the Automation document to process if the designated choice is true.',
                                    type: 'string'
                                }
                            }
                        }
                    ]
                },
                Default: {
                    description: 'The name of a step the workflow should jump to if none of the Choices are true.',
                    type: 'string'
                }
            }
        }
    }
}

export const branchSnippet: SnippetDefinition = {
    label: 'Snippet: aws:branch',
    description:
        'The aws:branch action enables you to create a dynamic Automation workflow that evaluates different choices in a single step and then jumps to a different step in the Automation document based on the results of that evaluation. \n\nWhen you specify the aws:branch action for a step, you specify Choices that the workflow must evaluate. The Choices can be based on either a value that you specified in the Parameters section of the Automation document, or a dynamic value generated as the output from the previous step. The Automation workflow evaluates each choice by using a Boolean expression. If the first choice is true, then the workflow jumps to the step designated for that choice. If the first choice is false, the workflow evaluates the next choice. The workflow continues evaluating each choice until it process a true choice. The workflow then jumps to the designated step for the true choice. \n\nIf none of the choices are true, the workflow checks to see if the step contains a default value. A default value defines a step that the workflow should jump to if none of the choices are true. If no default value is specified for the step, then the Automation workflow processes the next step in the document.\n\nThe aws:branch action supports complex choice evaluations by using a combination of And, Not, and Or operators.',
    body: {
        name: '${1:branch}',
        action: 'aws:branch',
        inputs: {
            Choices: [
                {
                    NextStep: 'runWindowsCommand',
                    Variable: '{{Name of a parameter defined in the Parameters section. For example: OS_name}}',
                    StringEquals: 'windows'
                },
                {
                    NextStep: 'runLinuxCommand',
                    Variable: '{{Name of a parameter defined in the Parameters section. For example: OS_name}}',
                    StringEquals: 'linux'
                }
            ],
            Default: 'sleep3'
        }
    }
}
