import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageService } from '../types'
import { LanguageServiceContext, LanguageServiceStrategy } from './types'

/**
 * Resolves the correct {@link LanguageService} implementation
 * for the given input.
 */
export class LanguageServiceRegistry implements LanguageServiceContext {
    constructor(private readonly strategies: LanguageServiceStrategy[] = []) {}

    /**
     * Add an additional strategy to be part of the registry.
     */
    public addStrategy(strategy: LanguageServiceStrategy) {
        this.strategies.push(strategy)
    }

    /**
     * Returns the {@link LanguageService} of the strategy
     * the matches the given input.
     */
    public async getLanguageService(textDocument: TextDocument): Promise<LanguageService | undefined> {
        const strategy = await this.getMatchingStrategy(textDocument)
        return strategy?.getLanguageService()
    }

    private async getMatchingStrategy(textDocument: TextDocument): Promise<LanguageServiceStrategy | undefined> {
        // Get all strategies that successfully 'match'
        const matchingStrategies = this.strategies.map(async strat => {
            if (await strat.isMatch(textDocument)) {
                return strat
            }
            return Promise.reject()
        })
        return Promise.any(matchingStrategies).catch(() => undefined)
    }
}
