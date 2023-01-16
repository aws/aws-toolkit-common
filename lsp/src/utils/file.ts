import got from 'got'
import * as fs from 'fs'

/**
 * Download the schema from {url} to {path}. If {path} already exists, then the schema won't be downloaded
 * @param url the url of the schema
 * @param path the path on the filesystem
 * @returns void
 */
export async function downloadSchema(url: string, path: string): Promise<void> {
    if (fs.existsSync(path)) {
        return
    }

    const schema: string = await got(url).json()
    fs.writeFileSync(path, schema)
}
