import {
    getLanguageService as getJsonLanguageService,
    LanguageService as JsonLanguageService
} from 'vscode-json-languageservice'
import { CompletionItem, CompletionList, Hover, HoverParams, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import {
    getLanguageService as getYamlLanguageService,
    LanguageService as YamlLanguageService
} from 'yaml-language-server'

export interface LanguageService {
    completion: (
        textDocument: TextDocument,
        textDocumentPosition: TextDocumentPositionParams
    ) => Promise<CompletionItem[] | CompletionList>
    hover: (textDocument: TextDocument, params: HoverParams) => Promise<Hover | null>
}

export interface BackendServices {
    yaml: YamlLanguageService
    json: JsonLanguageService
}

export class BackendService implements BackendServices {
    public static instance: BackendServices

    private constructor(public yaml: YamlLanguageService, public json: JsonLanguageService) {}

    public static getInstance(): BackendServices {
        if (!this.instance) {
            // TODO fill out the params for yaml language service
            const yaml = getYamlLanguageService(undefined, undefined, undefined, undefined, undefined, undefined)

            // TODO check if we need to pass any args
            const json = getJsonLanguageService({})
            BackendService.instance = new BackendService(yaml, json)
        }

        return BackendService.instance
    }
}
