import { SchemaProvider, textDocumentUtils } from '@lsp-placeholder/aws-lsp-core'
import {
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { JsonLanguageServiceWrapper } from './jsonLanguageServiceWrapper'

export type JsonSchemaServerProps = {
    connection: Connection
    defaultSchemaUri?: string
    schemaProvider?: SchemaProvider
}

export class JsonSchemaServer {
    /**
     * Options, provided by language server to `onInitialize` callback.
     */
    // protected options?: InitializeParams;
    /**
     * Text documents manager (see https://github.com/microsoft/vscode-languageserver-node/blob/main/server/src/common/textDocuments.ts#L68)
     */
    protected documents = new TextDocuments(TextDocument)

    protected jsonService: JsonLanguageServiceWrapper

    protected connection: Connection

    constructor(private readonly props: JsonSchemaServerProps) {
        this.connection = props.connection

        this.jsonService = new JsonLanguageServiceWrapper(props)

        this.connection.onInitialize((params: InitializeParams) => {
            // this.options = params;
            const result: InitializeResult = {
                // serverInfo: initialisationOptions?.serverInfo,
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                    completionProvider: { resolveProvider: true },
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
        const textDocument = this.documents.get(uri)

        if (!textDocument) {
            throw new Error(`Document with uri ${uri} not found.`)
        }

        return textDocument
    }

    async validateDocument(uri: string): Promise<void> {
        const textDocument = this.getTextDocument(uri)

        if (JsonLanguageServiceWrapper.isLangaugeIdSupported(textDocument.languageId) === false) {
            return
        }

        const diagnostics = await this.jsonService.doValidation(textDocument)
        this.connection.sendDiagnostics({ uri, version: textDocument.version, diagnostics })
    }

    registerHandlers() {
        this.documents.onDidOpen(({ document }) => {
            if (JsonLanguageServiceWrapper.isLangaugeIdSupported(document.languageId) === false) {
                return
            }

            this.validateDocument(document.uri)
        })

        this.documents.onDidChangeContent(({ document }) => {
            if (JsonLanguageServiceWrapper.isLangaugeIdSupported(document.languageId) === false) {
                return
            }
            this.validateDocument(document.uri)
        })

        this.connection.onCompletion(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (JsonLanguageServiceWrapper.isLangaugeIdSupported(textDocument.languageId) === false) {
                return
            }

            return await this.jsonService.doComplete(textDocument, position)
        })

        this.connection.onCompletionResolve(item => item)

        this.connection.onHover(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (JsonLanguageServiceWrapper.isLangaugeIdSupported(textDocument.languageId) === false) {
                return
            }

            return await this.jsonService.doHover(textDocument, position)
        })

        this.connection.onDocumentFormatting(async ({ textDocument: requestedDocument, options }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (JsonLanguageServiceWrapper.isLangaugeIdSupported(textDocument.languageId) === false) {
                return
            }

            return this.jsonService.format(textDocument, textDocumentUtils.getFullRange(textDocument), options)
        })
    }
}
