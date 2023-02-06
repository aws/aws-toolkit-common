/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import * as assert from 'assert'
import { service as JsonService } from '../json'
import { toDocument } from './utils/testUtilities'

suite('JSON Schema Validation for ASL', () => {
    test('JSON Schema Validation works', async () => {
        const { textDoc } = toDocument('{}')

        const res = await JsonService(textDoc.uri).diagnostic(textDoc)
        assert.strictEqual(res.length, 2)
        assert.ok(res.some(item => item.message === 'Missing property "States".'))
        assert.ok(res.some(item => item.message === 'Missing property "StartAt".'))
    })
})
