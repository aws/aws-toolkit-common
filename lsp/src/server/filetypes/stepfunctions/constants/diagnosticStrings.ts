/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

export const MESSAGES = {
    INVALID_NEXT: 'The value of "Next" property must be the name of an existing state.',
    INVALID_DEFAULT: 'The value of "Default" property must be the name of an existing state.',
    INVALID_START_AT: 'The value of "StartAt" property must be the name of an existing state.',
    INVALID_JSON_PATH_OR_INTRINSIC:
        'The value for the field must be a valid JSONPath or intrinsic function expression.',
    UNREACHABLE_STATE: 'The state cannot be reached. It must be referenced by at least one other state.',
    NO_TERMINAL_STATE:
        'No terminal state. The state machine must have at least one terminal state (a state in which the "End" property is set to true).',
    INVALID_PROPERTY_NAME: 'Field is not supported.',
    MUTUALLY_EXCLUSIVE_CHOICE_PROPERTIES: 'Each Choice Rule can only have one comparison operator.'
} as const

export const YAML_PARSER_MESSAGES = {
    DUPLICATE_KEY: 'Map keys must be unique'
} as const
