import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageServiceStrategy } from '../../registry/types'

import { LanguageContext } from '../../../server/context'
import { BuildspecService } from './service'

const BUILDSPEC_FILE_NAMES = ['build', 'buildspec'].map(name => [`${name}.yml`, `${name}.yaml`]).flat()

export class BuildspecServiceStrategy implements LanguageServiceStrategy {
    constructor(private readonly context: LanguageContext) {
        context.register(this)
    }

    async isMatch(textDocument: TextDocument): Promise<boolean> {
        return BUILDSPEC_FILE_NAMES.some(accepted => textDocument.uri.endsWith(accepted))
    }
    getLanguageService(): BuildspecService {
        return new BuildspecService(this.context)
    }
}
