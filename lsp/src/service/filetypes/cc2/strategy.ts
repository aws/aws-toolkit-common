import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageServiceStrategy } from '../../registry/types'

import { Cc2Service } from './service'

const CC2_FILE_NAMES = ['cc2'].map(name => [`${name}.yml`, `${name}.yaml`]).flat()

export class Cc2ServiceStrategy implements LanguageServiceStrategy {
    async isMatch(textDocument: TextDocument): Promise<boolean> {
        // return true
        return CC2_FILE_NAMES.some(accepted => textDocument.uri.endsWith(accepted))
    }
    getLanguageService(): Cc2Service {
        return new Cc2Service()
    }
}
