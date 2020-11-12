/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { validateInput } from '../src/parser'

describe('Parser', () => {
    test('Type missing description fails', () => {
        const input = `{
            "types": [
                {
                    "name": "result",
                    "allowedValues": ["Succeeded", "Failed", "Cancelled"],
                }
            ],
            "metrics": []
        }`
        expect(() => validateInput(input)).toThrowError('Failed to parse')
    })

    test('Missing metrics field', () => {
        const input = `{"types": []}`
        expect(() => validateInput(input)).toThrowError('Failed to parse')
    })

    test('Invalid data types', () => {
        const input = `{
            "types": [
                {
                    "name": "result",
                    "type": "type that does not exist",
                    "description": "abc"
                }
            ],
            "metrics": []
        }`
        expect(() => validateInput(input)).toThrowError('Failed to parse')
    })

    test('Successful parse', () => {
        const input = `{
            "metrics": []
        }`
        validateInput(input)
    })
})
