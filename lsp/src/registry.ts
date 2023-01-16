import { URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageService } from './service'

export interface RegistryItem {
    matches(uri: URI, contents: TextDocument): boolean
    onMatch(): LanguageService
}

export class Registry {

    private static instance: Registry
    private items: RegistryItem[]

    public static getInstance(): Registry {
        if (!this.instance) {
            Registry.instance = new Registry()
        }

        return Registry.instance
    }

    public addRegistryItem(item: RegistryItem) {
        this.items.push(item)
    }

    public getMatch(uri: URI, contents: TextDocument): LanguageService | undefined {
        for (const item of this.items) {
            if (item.matches(uri, contents)) {
                return item.onMatch()
            }
        }
        return undefined
    }

}