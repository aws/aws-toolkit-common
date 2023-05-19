import { LanguageService } from 'lsp-base'
import { TextDocument } from 'vscode-languageserver-textdocument'

/**
 * This is the 'Context' of the Strategy design pattern.
 *
 * It will decide which strategy to use and return a
 * {@link LanguageService} instance if it can be resolved.
 */
export interface LanguageServiceContext {
    getLanguageService(textDocument: TextDocument): Promise<LanguageService | undefined>
}
