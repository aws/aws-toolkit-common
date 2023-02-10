import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageService } from '../service'


/**
 * This is a 'Strategy' of the Strategy design pattern.
 * 
 * It will help in providing the correct {@link LanguageService}
 * implementation.
 */
export interface LanguageServiceStrategy {
    /**
     * True if the {@link LanguageService} from this
     * strategy should be used.
     */
    isMatch(textDocument: TextDocument): boolean
    getLanguageService(textDocument: TextDocument): LanguageService
}

/**
 * This is the 'Context' of the Strategy design pattern.
 * 
 * It will decide which strategy to use and return a
 * {@link LanguageService} instance if it can be resolved.
 */
export interface LanguageServiceContext {
    getLanguageService(textDocument: TextDocument): LanguageService | undefined
}