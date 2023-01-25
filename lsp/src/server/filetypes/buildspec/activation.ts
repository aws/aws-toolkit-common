import { URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BackendService } from '../../service'
import { RegistryItem } from '../../registry'
import { service } from './service'

const SCHEMA_URL = 'https://d3rrggjwfhwld2.cloudfront.net/CodeBuild/buildspec/buildspec-standalone.schema.json'
const BUILDSPEC_FILE_NAMES = ['build', 'buildspec'].map(name => [`${name}.yml`, `${name}.yaml`]).flat()

export function activate(): RegistryItem {
    return {
        matches(uri: URI, contents: TextDocument) {
            return BUILDSPEC_FILE_NAMES.some(accepted => uri.endsWith(accepted))
        },
        onMatch() {
            BackendService.getInstance().yaml.configure({
                schemas: [
                    {
                        fileMatch: BUILDSPEC_FILE_NAMES,
                        uri: SCHEMA_URL
                    }
                ],
                hover: true,
                completion: true,
                validate: true,
                customTags: []
            })
            return service()
        }
    }
}
