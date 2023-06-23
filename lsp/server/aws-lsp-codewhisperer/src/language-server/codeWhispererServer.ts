import { AwsLanguageService } from '@lsp-placeholder/aws-lsp-core'
import {
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export type CodeWhispererServerProps = {
    connection: Connection
    codeWhispererService: AwsLanguageService
}

/**
 * This is a demonstration language server that TODO
 *
 * This illustrates TODO how we can use an AWS Service Client in an LSP.
 * It will be used to explore deeper integration concerns, like credentials.
 */
export class CodeWhispererServer {
    public static readonly serverId = 'aws-lsp-codewhisperer'

    protected documents = new TextDocuments(TextDocument)

    protected service: AwsLanguageService

    protected connection: Connection

    constructor(private readonly props: CodeWhispererServerProps) {
        this.connection = props.connection

        this.service = this.props.codeWhispererService

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
                },
            }
            return result
        })
        this.registerHandlers()
        this.documents.listen(this.connection)
        this.connection.listen()

        this.connection.console.info('AWS CodeWhisperer language server started!')
    }

    getTextDocument(uri: string): TextDocument {
        const textDocument = this.documents.get(uri)

        if (!textDocument) {
            throw new Error(`Document with uri ${uri} not found.`)
        }

        return textDocument
    }

    registerHandlers() {
        this.connection.onCompletion(async ({ textDocument: requestedDocument, position }) => {
            const textDocument = this.getTextDocument(requestedDocument.uri)

            if (this.service.isSupported(textDocument)) {
                return await this.service.doComplete(textDocument, position)
            }

            return
        })

        this.connection.onCompletionResolve(item => item)
    }
}
