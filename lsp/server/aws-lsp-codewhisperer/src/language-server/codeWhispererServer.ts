import { AwsLanguageService } from '@lsp-placeholder/aws-lsp-core'
import {
    CancellationToken,
    CompletionParams,
    Connection,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    TextDocuments,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CodeWhispererService } from './codeWhispererService'

export type CodeWhispererServerProps = {
    connection: Connection
    codeWhispererService: AwsLanguageService
}

/**
 * This is a demonstration language server that gets code recommendations from
 * CodeWisperer.
 *
 * It will be used to explore deeper integration concerns, like providing bearer token access.
 */
export class CodeWhispererServer {
    public static readonly serverId = 'aws-lsp-codewhisperer'

    protected documents = new TextDocuments(TextDocument)

    // HACK: Ideally we keep things to the standard AwsLanguageService interface
    // For now we're experimenting with service calls.
    protected service: CodeWhispererService

    protected connection: Connection

    constructor(private readonly props: CodeWhispererServerProps) {
        this.connection = props.connection

        this.service = this.props.codeWhispererService as CodeWhispererService

        this.connection.onInitialize((params: InitializeParams) => {
            // this.options = params;
            const result: InitializeResult = {
                // serverInfo: initialisationOptions?.serverInfo,
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                    completionProvider: {
                        resolveProvider: true,
                        completionItem: {
                            labelDetailsSupport: true,
                        },
                    },
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
        this.connection.onCompletion(async (params: CompletionParams, token: CancellationToken) => {
            const textDocument = this.getTextDocument(params.textDocument.uri)

            if (this.service.isSupported(textDocument)) {
                return await this.service.doComplete2({
                    textDocument,
                    position: params.position,
                    token,
                })
            }

            return
        })

        this.connection.onCompletionResolve(item => item)
    }
}
