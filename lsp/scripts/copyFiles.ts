/**
 * This script copies files from a target location to a destination location.
 * This is necessary for copying the bundled stepfunctions json schema to the out directory.
 * Typescript doesn't have a way to automatically copy over json files unless they are explicitly
 * imported which we can't do in our case.
 *
 * Instead, we ensure that all files are copied over during build phase
 */
import * as fs from 'fs-extra'
import * as path from 'path'

const repoRoot = process.cwd()
const outRoot = path.join(repoRoot, 'out')

interface CopyTask {
    readonly target: string

    // If destination is undefined then target is used
    readonly destination?: string
}

const tasks: CopyTask[] = [
    {
        target: path.join('src', 'server', 'filetypes', 'stepfunctions', 'json-schema', 'bundled.json')
    }
]

async function copy(task: CopyTask): Promise<void> {
    const source = path.resolve(repoRoot, task.target)
    const destination = path.resolve(outRoot, task.destination ? task.destination : task.target)
    const destinationDir = path.dirname(destination)

    try {
        await fs.mkdir(destinationDir, {
            recursive: true
        })
        await fs.copy(source, destination, {
            overwrite: true,
            errorOnExist: false
        })
    } catch (error) {
        throw new Error(
            `Copy "${source}" to "${destination}" failed: ${error instanceof Error ? error.message : error}`
        )
    }
}

// eslint-disable-next-line @typescript-eslint/no-extra-semi
;(async () => {
    try {
        await Promise.all(tasks.map(copy))
    } catch (error) {
        console.error('`copyFiles.ts` failed')
        console.error(error)
        process.exit(1)
    }
})()
