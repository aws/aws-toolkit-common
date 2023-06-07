import { SchemaProvider, completionItemUtils } from '@lsp-placeholder/aws-lsp-core'
import {
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { YamlLanguageServiceWrapper } from './yamlLanguageServiceWrapper'

export type YamlSchemaServerProps = {
    displayName: string
    connection: Connection
    defaultSchemaUri: string
    schemaProvider: SchemaProvider
}

export class YamlSchemaServer {
    /**
     * Options, provided by language server to `onInitialize` callback.
     */
    // protected options?: InitializeParams;
    /**
     * Text documents manager (see https://github.com/microsoft/vscode-languageserver-node/blob/main/server/src/common/textDocuments.ts#L68)
     */
    protected documents = new TextDocuments(TextDocument)

    protected yamlService: YamlLanguageServiceWrapper
    protected connection: Connection

    constructor(private readonly props: YamlSchemaServerProps) {
        this.connection = props.connection

        this.yamlService = new YamlLanguageServiceWrapper(props)

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

    getTextDocument(uri: string): TextDocument {
        const doc = this.documents.get(uri)
        if (!doc) {
            throw new Error(`Document with uri ${uri} not found.`)
        }

        return doc
    }

    async validateDocument(uri: string): Promise<void> {
        try {
            const textDocument = this.getTextDocument(uri)

            if (YamlLanguageServiceWrapper.isLangaugeIdSupported(textDocument.languageId) === false) {
                return
            }

            const diagnostics = await this.yamlService.doValidation(textDocument)
            this.connection.sendDiagnostics({ uri, version: textDocument.version, diagnostics })
        } catch (error) {
            this.connection.console.info(`AWS Yaml validation error: ${error}`)
        }
    }

    registerHandlers() {
        this.documents.onDidOpen(({ document }) => {
            if (YamlLanguageServiceWrapper.isLangaugeIdSupported(document.languageId) === false) {
                return
            }

            this.validateDocument(document.uri)
        })

        this.documents.onDidChangeContent(({ document }) => {
            if (YamlLanguageServiceWrapper.isLangaugeIdSupported(document.languageId) === false) {
                return
            }
            this.validateDocument(document.uri)
        })

        this.connection.onCompletion(async ({ textDocument: requestedDocument, position }) => {
            try {
                this.connection.console.info('AWS Yaml completion')

                const textDocument = this.getTextDocument(requestedDocument.uri)

                if (YamlLanguageServiceWrapper.isLangaugeIdSupported(textDocument.languageId) === false) {
                    return
                }

                const results = await this.yamlService.doComplete(textDocument, position)
                // this.connection.console.info(JSON.stringify(results.items, null, 4))

                completionItemUtils.prependItemDetail(results.items, this.props.displayName)

                return results
            } catch (error) {
                this.connection.console.info(`AWS Yaml completion error: ${error} `)
            }
        })

        this.connection.onHover(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (YamlLanguageServiceWrapper.isLangaugeIdSupported(textDocument.languageId) === false) {
                return
            }

            return await this.yamlService.doHover(textDocument, position)
        })

        this.connection.onDocumentFormatting(({ textDocument: requestedDocument, options }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (YamlLanguageServiceWrapper.isLangaugeIdSupported(textDocument.languageId) === false) {
                return
            }

            return this.yamlService.doFormat(textDocument, {})
        })

        // this.connection.onCompletionResolve(item => {
        //     this.connection.console.info(JSON.stringify(item, null, 4))
        //     return item
        // })
    }
}