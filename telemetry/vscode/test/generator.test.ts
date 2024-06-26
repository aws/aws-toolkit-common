/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
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

    test('validation', async () => {
        await expect(testGenerator(['resources/invalidInput.json'], '/invalid/file/path')).rejects.toBeDefined()
    })

    test('with normal input', async () => {
        await testGenerator([`resources/generatorInput.json`], `resources/generatorOutput.ts`)
    })

    test('overrides', async () => {
        await testGenerator(
            ['resources/testOverrideInput.json', 'resources/testResultInput.json'],
            'resources/generatorOverrideOutput.ts'
        )
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
