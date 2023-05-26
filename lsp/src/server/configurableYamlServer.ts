// TODO : figure out if these are the right packages to import from; do type imports where possible
import {
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageService, SchemaRequestService, getLanguageService } from 'yaml-language-server'

export type ConfigurableYamlLanguageServerProps = {
    displayName: string
    connection: Connection
    defaultSchemaUri: string
    schemaRequestService: SchemaRequestService
}

export class ConfigurableYamlLanguageServer {
    /**
     * Options, provided by language server to `onInitialize` callback.
     */
    // protected options?: InitializeParams;
    /**
     * Text documents manager (see https://github.com/microsoft/vscode-languageserver-node/blob/main/server/src/common/textDocuments.ts#L68)
     */
    protected documents = new TextDocuments(TextDocument)

    protected yamlService: LanguageService
    protected connection: Connection

    constructor(private readonly props: ConfigurableYamlLanguageServerProps) {
        this.connection = props.connection

        const workspaceContext = {
            resolveRelativePath(relativePath: string, resource: string) {
                return new URL(relativePath, resource).href
            },
        }

        this.yamlService = getLanguageService({
            schemaRequestService: this.props.schemaRequestService,
            workspaceContext,
        })

        this.yamlService.configure({ schemas: [{ fileMatch: ['*.yml'], uri: this.props.defaultSchemaUri }] })

        this.connection.onInitialize((params: InitializeParams) => {
            // this.options = params;
            const result: InitializeResult = {
                // serverInfo: initialisationOptions?.serverInfo,
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },

                    // TODO : when resolveProvider is true, we didn't see documentation field in the VS Code completion UI
                    // TODO : Does VS do this as well? This could be problematic for implementors who set resolveProvider to true
                    completionProvider: { resolveProvider: false },
                    hoverProvider: true,
                    documentFormattingProvider: true,
                    // ...(initialisationOptions?.capabilities || {}),
                },
            }
            return result
        })
        this.registerHandlers()
        this.documents.listen(this.connection)
        this.connection.listen()

        this.connection.console.info('AWS Documents LS started!')
    }

    getTextDocument(uri: string, throwIfEmpty = false): TextDocument | undefined {
        const doc = this.documents.get(uri)
        if (!doc) {
            throw new Error(`Document with uri ${uri} not found.`)
        }

        return doc
    }

    async validateDocument(uri: string): Promise<void> {
        try {
            const textDocument = this.getTextDocument(uri, true)!
            this.updateSchemaMapping(uri)
            const diagnostics = await this.yamlService.doValidation(textDocument, false)
            this.connection.sendDiagnostics({ uri, version: textDocument.version, diagnostics })
        } catch (error) {
            this.connection.console.info(`AWS Yaml validation error: ${error}`)
        }
    }

    registerHandlers() {
        this.documents.onDidOpen(({ document }) => {
            this.validateDocument(document.uri)
        })

        this.documents.onDidChangeContent(({ document }) => {
            this.validateDocument(document.uri)
        })

        this.connection.onCompletion(async ({ textDocument: requestedDocument, position }) => {
            try {
                this.connection.console.info('AWS Yaml completion')

                const textDocument = this.getTextDocument(requestedDocument.uri, true)!
                this.updateSchemaMapping(requestedDocument.uri)

                const results = await this.yamlService.doComplete(textDocument, position, false)
                this.connection.console.info(JSON.stringify(results.items, null, 4))
                for (const item of results.items) {
                    item.detail = item.detail!! ? `${this.props.displayName}: ${item.detail}` : this.props.displayName
                }
                return results
            } catch (error) {
                this.connection.console.info(`AWS Yaml completion error: ${error} `)
            }
        })

        this.connection.onHover(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri, true)!
            this.updateSchemaMapping(requestedDocument.uri)
            return await this.yamlService.doHover(textDocument, position)
        })

        this.connection.onDocumentFormatting(({ textDocument: requestedDocument, options }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri, true)!
            this.updateSchemaMapping(requestedDocument.uri)
            return this.yamlService.doFormat(textDocument, {})
        })

        // this.connection.onCompletionResolve(item => {
        //     this.connection.console.info(JSON.stringify(item, null, 4))
        //     return item
        // })
    }

    updateSchemaMapping(documentUri: string): void {
        this.yamlService.configure({
            hover: true,
            completion: true,
            validate: true,
            customTags: [],
            schemas: [
                {
                    fileMatch: [documentUri],
                    uri: this.props.defaultSchemaUri,
                    name: this.props.displayName,
                    description: 'some description,',
                },
            ],
        })
    }
}
