// TODO : figure out if these are the right packages to import from; do type imports where possible
import {
    JSONDocument,
    LanguageService,
    SchemaRequestService,
    TextDocument,
    getLanguageService,
} from 'vscode-json-languageservice'
import {
    Connection,
    InitializeParams,
    InitializeResult,
    Range,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'

// TODO : move to a separate file
export const jsonSchemaUrls = {
    buildSpec: 'https://d3rrggjwfhwld2.cloudfront.net/CodeBuild/buildspec/buildspec-standalone.schema.json',
    placeholder: 'foo://server/data.schema.json',
}

export type ConfigurableJsonLanguageServerProps = {
    connection: Connection
    defaultSchemaUri?: string
    schemaRequestService?: SchemaRequestService
}

export class ConfigurableJsonLanguageServer {
    /**
     * Options, provided by language server to `onInitialize` callback.
     */
    // protected options?: InitializeParams;
    /**
     * Text documents manager (see https://github.com/microsoft/vscode-languageserver-node/blob/main/server/src/common/textDocuments.ts#L68)
     */
    protected documents = new TextDocuments(TextDocument)

    protected jsonService: LanguageService

    protected connection: Connection

    constructor(private readonly props: ConfigurableJsonLanguageServerProps) {
        this.connection = props.connection

        this.jsonService = getLanguageService({
            schemaRequestService: props.schemaRequestService?.bind(this),
        })

        const schemas = props.defaultSchemaUri ? [{ fileMatch: ['*.json'], uri: props.defaultSchemaUri }] : undefined

        this.jsonService.configure({ allowComments: false, schemas })

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

    getTextDocument(uri: string): TextDocument | undefined {
        return this.documents.get(uri)
    }

    getTextDocumentAndJsonDocument(uri: string): [TextDocument, JSONDocument] {
        const textDocument = this.getTextDocument(uri)
        /* istanbul ignore next */
        const jsonDocument = textDocument ? this.jsonService.parseJSONDocument(textDocument) : undefined
        /* istanbul ignore next */
        if (!textDocument || !jsonDocument) {
            throw new Error(`Document with uri ${uri} not found.`)
        }
        return [textDocument, jsonDocument]
    }

    async validateDocument(uri: string): Promise<void> {
        const [textDocument, jsonDocument] = this.getTextDocumentAndJsonDocument(uri)
        if (textDocument.languageId != 'json') {
            return
        }

        const diagnostics = await this.jsonService.doValidation(textDocument, jsonDocument)
        this.connection.sendDiagnostics({ uri, version: textDocument.version, diagnostics })
    }

    registerHandlers() {
        this.documents.onDidOpen(({ document }) => {
            this.validateDocument(document.uri)
        })

        this.documents.onDidChangeContent(({ document }) => {
            this.validateDocument(document.uri)
        })

        this.connection.onCompletion(async ({ textDocument: requestedDocument, position }) => {
            const [textDocument, jsonDocument] = this.getTextDocumentAndJsonDocument(requestedDocument.uri)
            return await this.jsonService.doComplete(textDocument, position, jsonDocument)
        })

        this.connection.onCompletionResolve(item => item)

        this.connection.onHover(async ({ textDocument: requestedDocument, position }) => {
            const [textDocument, jsonDocument] = this.getTextDocumentAndJsonDocument(requestedDocument.uri)
            return await this.jsonService.doHover(textDocument, position, jsonDocument)
        })

        this.connection.onDocumentFormatting(async ({ textDocument: requestedDocument, options }) => {
            const [textDocument] = this.getTextDocumentAndJsonDocument(requestedDocument.uri)
            return await this.jsonService.format(textDocument, getTextDocumentFullRange(textDocument), options)
        })
    }
}

const getTextDocumentFullRange = (textDocument: TextDocument): Range => {
    return {
        start: {
            line: 0,
            character: 0,
        },
        end: {
            line: textDocument.lineCount,
            character: 0,
        },
    }
}
