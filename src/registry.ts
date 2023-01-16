import { URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export interface RegistryItem {
    matches(uri: URI, contents: TextDocument): boolean;
    onMatch(): void;
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

}