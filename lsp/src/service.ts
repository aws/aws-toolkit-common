import { xhr } from 'request-light'
import {
    getLanguageService as getJsonLanguageService,
    LanguageService as JsonLanguageService
} from 'vscode-json-languageservice'
import {
    CompletionItem,
    CompletionList,
    Diagnostic,
    Hover,
    HoverParams,
    TextDocumentPositionParams
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createConnection } from 'vscode-languageserver/node'
import {
    getLanguageService as getYamlLanguageService,
    LanguageService as YamlLanguageService
} from 'yaml-language-server'

export interface LanguageService {
    completion: (
        document: TextDocument,
        textDocumentPosition: TextDocumentPositionParams
    ) => Promise<CompletionItem[] | CompletionList>
    diagnostic: (document: TextDocument) => Promise<Diagnostic[]>
    hover: (document: TextDocument, params: HoverParams) => Promise<Hover | null>
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
            const schemaResolver = async (url: string): Promise<string> => {
                return (await xhr({ url })).responseText
            }
            const workspaceContext = {
                resolveRelativePath(relativePath: string, resource: string) {
                    return new URL(relativePath, resource).href
                }
            }
            const connection = createConnection()
            const yaml = getYamlLanguageService(schemaResolver, workspaceContext, connection, null as any, null as any)
            yaml.configure({
                hover: true,
                completion: true,
                validate: true
            })

            // TODO check if we need to pass any args
            const json = getJsonLanguageService({})
            BackendService.instance = new BackendService(yaml, json)
        }

        return BackendService.instance
    }
}
