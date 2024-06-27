/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { generate } from '../src/generate'
import { tmpdir } from 'os'
import * as fs from 'fs-extra'

/**
 * Replaces the "types" field in the given json file with the "types" field
 * from `commonDefinitions.json`.
 *
 * @returns Original contents of `relPath`.
 */
async function writeCommonTypesToFile(relPath: string) {
    const testInputFile = `${__dirname}/${relPath}`
    const commonDefsStr = await fs.readFile(`${__dirname}/../../definitions/commonDefinitions.json`)
    const commonDefs = JSON.parse(commonDefsStr.toString())
    const commonTypes = commonDefs.types
    const testInputStr = (await fs.readFile(testInputFile)).toString()
    const testInputJson = JSON.parse(testInputStr)
    // Use the "types" array from commonDefinitions.json.
    testInputJson.types = commonTypes
    await fs.writeFile(testInputFile, JSON.stringify(testInputJson, undefined, 4))

    return testInputStr
}

async function restoreFile(relPath: string, data: string) {
    const testInputFile = `${__dirname}/${relPath}`
    await fs.writeFile(testInputFile, data)
}

describe('Generator', () => {
    let tempDir: string
    beforeAll(() => {
        tempDir = tmpdir()
    })

    test('validation', async () => {
        await expect(testGenerator(['resources/invalidInput.json'], '/invalid/file/path')).rejects.toBeDefined()
    })

    test('with normal input', async () => {
        const oldFileContent = await writeCommonTypesToFile('resources/generatorInput.json')

        await testGenerator(['resources/generatorInput.json'], 'resources/generatorOutput.ts')

        restoreFile('resources/generatorInput.json', oldFileContent)
    })

    test('overrides', async () => {
        const oldFileContent = await writeCommonTypesToFile('resources/testOverrideInput.json')

        await testGenerator(
            ['resources/testOverrideInput.json', 'resources/testResultInput.json'],
            'resources/generatorOverrideOutput.ts'
        )

        restoreFile('resources/testOverrideInput.json', oldFileContent)
    })

    async function testGenerator(inputFiles: string[], expectedOutputFile: string) {
        const output = `${tempDir}/output`
        await generate({ inputFiles: inputFiles.map(item => `${__dirname}/${item}`), outputFile: output })
        // TODO remove spaces and line returns so that it matches more generally? pull in a better matching lib?
        const actualOutput = await fs.readFile(output, 'utf-8')
        const expectedOutput = await fs.readFile(`${__dirname}/${expectedOutputFile}`, 'utf-8')
        expect(actualOutput).toEqual(expectedOutput)
    }
})
