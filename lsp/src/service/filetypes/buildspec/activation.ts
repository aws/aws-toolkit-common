import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageServiceStrategy } from '../../registry/types'

import { BackendService, LanguageService } from '../../service'
import { service } from './service'

const SCHEMA_URL = 'https://d3rrggjwfhwld2.cloudfront.net/CodeBuild/buildspec/buildspec-standalone.schema.json'
const BUILDSPEC_FILE_NAMES = ['build', 'buildspec'].map(name => [`${name}.yml`, `${name}.yaml`]).flat()

export class BuildspecServiceStrategy implements LanguageServiceStrategy {
    isMatch(textDocument: TextDocument): boolean {
        return BUILDSPEC_FILE_NAMES.some(accepted => textDocument.uri.endsWith(accepted))
    }
    getLanguageService(textDocument: TextDocument): LanguageService {
        BackendService.getInstance().yaml.configure({
            schemas: [
                {
                    fileMatch: [textDocument.uri],
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
