import { URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { RegistryItem } from '../../registry'
import { downloadSchema } from '../../utils/file'
import { service } from './service'

const SCHEMA_URL = 'https://d3rrggjwfhwld2.cloudfront.net/CodeBuild/buildspec/buildspec-standalone.schema.json'

export function activate(): RegistryItem {
    try {
        downloadSchema(SCHEMA_URL, '/tmp/buildspec.txt')
    } catch {
        // TODO: Write back to the client and explain that these features could not be activated
    }

    return {
        matches(uri: URI, contents: TextDocument) {
            return uri.endsWith('build.yml') || uri.endsWith('build.yaml')
        },
        onMatch() {
            return service()
        }
    }
}
