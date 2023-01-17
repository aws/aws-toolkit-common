import { URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { RegistryItem } from '../../registry'
import { BackendService } from '../../service'
import { service } from './service'

const SCHEMA_URL = 'https://d3rrggjwfhwld2.cloudfront.net/CodeBuild/buildspec/buildspec-standalone.schema.json'

export function activate(): RegistryItem {
    return {
        matches(uri: URI, contents: TextDocument) {
            return uri.endsWith('build.yml') || uri.endsWith('build.yaml')
        },
        onMatch() {
            BackendService.getInstance().yaml.configure({
                schemas: [
                    {
                        fileMatch: ['build.yml', 'build.yaml'],
                        uri: SCHEMA_URL
                    }
                ],
                hover: true,
                completion: true,
                validate: true
            })
            return service()
        }
    }
}
