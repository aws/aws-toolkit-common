/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { generate } from '../src/generate'
import { tmpdir } from 'os'
import { readFile } from 'fs-extra'

describe('Generator', () => {
    let tempDir: string
    beforeAll(() => {
        tempDir = tmpdir()
    })

    test('Generate fails when validation fails', async () => {
        try {
            await testGenerator(['resources/invalidInput.json'], '/invalid/file/path' )
        } catch (e) {
            expect(e).not.toBeNull
            return
        }
        throw Error("Test did not throw as expected")
    })

    test('Generates with normal input', async () => {
        await testGenerator([`resources/generatorInput.json`], `resources/generatorOutput`)
    })

    test('Generate overrides', async () => {
        await testGenerator(['resources/testOverrideInput.json', 'resources/testResultInput.json'], 'resources/generatorOverrideOutput')
    })

    async function testGenerator(inputFiles: string[], expectedOutputFile: string) {
        const output = `${tempDir}/output`
        await generate({ inputFiles: inputFiles.map(item => `${__dirname}/${item}`), outputFile: output })
        // TODO remove spaces and line returns so that it matches more generally? pull in a better matching lib?
        const actualOutput = await readFile(output, 'utf-8')
        const expectedOutput = await readFile(`${__dirname}/${expectedOutputFile}`, 'utf-8')
        expect(actualOutput).toEqual(expectedOutput)
    }
})
