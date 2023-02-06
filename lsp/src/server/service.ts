import {
    getLanguageService as getJsonLanguageService,
    LanguageService as JsonLanguageService
} from 'vscode-json-languageservice'
import {
    CompletionItem,
    CompletionList,
    Connection,
    Diagnostic,
    Hover,
    HoverParams,
    TextDocumentPositionParams
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { createConnection } from 'vscode-languageserver/lib/node/main'
import {
    getLanguageService as getYamlLanguageService,
    LanguageService as YamlLanguageService
} from 'yaml-language-server'

import { UriCacheManager } from './utils/uri/cache'

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

// This interface is from the yaml-language-server. We should get them to export it
interface TelemetryEvent {
    name: string
    type?: string
    properties?: unknown
    measures?: unknown
    traits?: unknown
    context?: unknown
}

// This interface is from the yaml-language-server. We should get them to export it
interface Telemetry {
    send(event: TelemetryEvent): void
    sendError(name: string, properties: unknown): void
    sendTrack(name: string, properties: unknown): void
}

class YAMLTelemetry implements Telemetry {
    constructor(private connection: Connection) {}

    send(event: TelemetryEvent): void {
        // stub implementation
    }

    // The YAML language server sends error events in the form of:
    // yaml.${service}.error, { error: "the error message" }
    // e.g. yaml.documentSymbols.error, { error: "Could not get documents cache" }
    sendError(name: string, properties: unknown): void {
        this.connection.window.showErrorMessage(`${name}: ${properties}`)
    }

    sendTrack(name: string, properties: unknown): void {
        // stub implementation
    }
}

export class BackendService implements BackendServices {
    public static instance: BackendServices

    private constructor(public yaml: YamlLanguageService, public json: JsonLanguageService) {}

    public static getInstance(): BackendServices {
        if (!this.instance) {
            const uriResolver = new UriCacheManager()
            const schemaResolver = uriResolver.getContentFromString.bind(uriResolver)

            const workspaceContext = {
                resolveRelativePath(relativePath: string, resource: string) {
                    return new URL(relativePath, resource).href
                }
            }
            const connection = createConnection()
            const yamlTelemetry = new YAMLTelemetry(connection)
            const yaml = getYamlLanguageService(
                schemaResolver,
                workspaceContext,
                connection,
                yamlTelemetry,
                null as any
            )
            yaml.configure({
                hover: true,
                completion: true,
                validate: true,
                customTags: []
            })

            const json = getJsonLanguageService({
                schemaRequestService: schemaResolver,
                workspaceContext
            })
            BackendService.instance = new BackendService(yaml, json)
        }

        return BackendService.instance
    }
}
