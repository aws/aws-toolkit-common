// TODO : figure out if these are the right packages to import from; do type imports where possible
import { JSONDocument, LanguageService, TextDocument, getLanguageService } from 'vscode-json-languageservice'
import {
    Connection,
    InitializeParams,
    InitializeResult,
    Range,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'

export class JSONLanguageServer {
    /**
     * Options, provided by language server to `onInitialize` callback.
     */
    // protected options?: InitializeParams;
    /**
     * Text documents manager (see https://github.com/microsoft/vscode-languageserver-node/blob/main/server/src/common/textDocuments.ts#L68)
     */
    protected documents = new TextDocuments(TextDocument)

    protected jsonService: LanguageService

    constructor(private readonly connection: Connection) {
        const jsonSchemaUri = 'foo://server/data.schema.json'
        // taken from https://json-schema.org/learn/miscellaneous-examples.html#basic
        const jsonSchema = {
            type: 'object',
            properties: {
                firstName: {
                    type: 'string',
                    description: "The person's first name.",
                },
                lastName: {
                    type: 'string',
                    description: "The person's last name.",
                },
                age: {
                    description: 'Age in years which must be equal to or greater than zero.',
                    type: 'integer',
                    minimum: 0,
                },
            },
        }
        this.jsonService = getLanguageService({
            schemaRequestService: () => {
                return Promise.resolve(JSON.stringify(jsonSchema))
            },
        })
        this.jsonService.configure({ allowComments: false, schemas: [{ fileMatch: ['*.json'], uri: jsonSchemaUri }] })

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
