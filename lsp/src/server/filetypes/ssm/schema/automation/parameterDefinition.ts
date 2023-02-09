/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { JSONSchema } from 'vscode-json-languageservice'

export const parameterDefinition: JSONSchema = {
    type: 'object',
    description: 'Parameter definition.',
    required: ['type'],
    properties: {
        description: {
            type: 'string',
            description: '(Optional) A description of the parameter.'
        },
        type: {
            type: 'string',
            description:
                '(Required) Allowed values include the following: String, StringList, Boolean, Integer, MapList, and StringMap.',
            enum: ['String', 'StringList', 'Boolean', 'Integer', 'MapList', 'StringMap']
        },
        default: {
            description:
                '(Optional) The default value of the parameter or a reference to a parameter in Parameter Store.'
        },
        allowedValues: {
            type: 'array',
            description:
                '(Optional) An array of values allowed for the parameter. Defining allowed values for the parameter validates the user input. If a user inputs a value that is not allowed, the execution fails to start.'
        },
        allowedPattern: {
            type: 'string',
            description:
                '(Optional) A regular expression that validates whether the user input matches the defined pattern for the parameter. If the user input does not match the allowed pattern, the execution fails to start.'
        },
        displayType: {
            type: 'string',
            description:
                '(Optional) Used to display either a textfield or a textarea in the AWS Management Console. textfield is a single-line text box. textarea is a multi-line text area.',
            enum: ['textfield', 'textarea']
        },
        minItems: {
            type: 'number',
            description: '(Optional) The minimum number of items allowed.'
        },
        maxItems: {
            type: 'number',
            description: '(Optional) The maximum number of items allowed.'
        },
        minChars: {
            type: 'number',
            description: '(Optional) The minimum number of parameter characters allowed.'
        },
        maxChars: {
            type: 'number',
            description: '(Optional) The maximum number of parameter characters allowed.'
        }
    },
    additionalProperties: false,
    allOf: [
        {
            if: {
                properties: { type: { const: 'String' } }
            },
            then: {
                properties: {
                    default: {
                        type: 'string'
                    },
                    allowedValues: {
                        items: {
                            type: 'string'
                        }
                    }
                }
            }
        },
        {
            if: {
                properties: { type: { const: 'Boolean' } }
            },
            then: {
                properties: {
                    default: {
                        type: 'boolean'
                    },
                    allowedValues: {
                        items: {
                            type: 'boolean'
                        }
                    }
                }
            }
        },
        {
            if: {
                properties: { type: { const: 'Integer' } }
            },
            then: {
                properties: {
                    default: {
                        type: 'number'
                    },
                    allowedValues: {
                        items: {
                            type: 'number'
                        }
                    }
                }
            }
        },
        {
            if: {
                properties: { type: { const: 'StringList' } }
            },
            then: {
                properties: {
                    default: {
                        items: {
                            type: 'string'
                        }
                    },
                    allowedValues: {
                        items: {
                            type: ['string', 'array']
                        }
                    }
                }
            }
        },
        {
            if: {
                properties: { type: { const: 'StringMap' } }
            },
            then: {
                properties: {
                    default: {
                        items: {
                            type: 'object'
                        }
                    },
                    allowedValues: {
                        items: {
                            type: 'object'
                        }
                    }
                }
            }
        },
        {
            if: {
                properties: { type: { const: 'MapList' } }
            },
            then: {
                properties: {
                    default: {
                        items: {
                            type: 'array',
                            items: {
                                type: 'object'
                            }
                        }
                    },
                    allowedValues: {
                        items: {
                            type: ['object', 'array']
                        }
                    }
                }
            }
        }
    ]
}
