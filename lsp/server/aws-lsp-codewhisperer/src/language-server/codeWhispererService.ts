import { AwsLanguageService } from '@lsp-placeholder/aws-lsp-core'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
import { CancellationToken, CompletionItem, CompletionItemKind, Connection } from 'vscode-languageserver'
import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'
import { createCodeWhispererClient } from '../client/codewhisperer'
import CodeWhispererClient = require('../client/codewhispererclient')

export type CodeWhispererServiceProps = {
    displayName: string
    // HACK: connection is passed in for logging purposes
    connection: Connection
}

export interface CompletionParams {
    textDocument: TextDocument
    position: Position
    token: CancellationToken
}

export class CodeWhispererService implements AwsLanguageService {
    constructor(private readonly props: CodeWhispererServiceProps) {}

    isSupported(document: TextDocument): boolean {
        return true
    }

    async doComplete(textDocument: TextDocument, position: Position): Promise<CompletionList | null> {
        return this.doComplete2({ textDocument, position, token: CancellationToken.None })
    }

    async doComplete2(params: CompletionParams): Promise<CompletionList | null> {
        // This just uses the system's default credentials. A future investigation will
        // look at providing credentials from the LSP client.
        const options: ServiceConfigurationOptions = {
            region: 'us-east-1',
        }

        // CONCEPT: This is using the IAM credentials client.
        // We want to build up to using the bearer token client.
        const client = createCodeWhispererClient(options)

        const left = params.textDocument.getText({
            start: { line: 0, character: 0 },
            end: params.position,
        })
        const right = params.textDocument.getText({
            start: params.position,
            end: params.textDocument.positionAt(params.textDocument.getText().length),
        })

        const request: CodeWhispererClient.GenerateRecommendationsRequest = {
            fileContext: {
                filename: params.textDocument.uri,
                programmingLanguage: {
                    languageName: 'typescript',
                },
                leftFileContent: left,
                rightFileContent: right,
            },
            maxResults: 5,
        }

        let items: CompletionItem[] = []
        let count = 1

        // We will get all the paginated recommendations.
        // This is slow, and holds up the IDE's autocompletion list from showing.
        // We wouldn't do this in a release.
        do {
            if (params.token.isCancellationRequested) {
                this.props.connection.console.info('*** CANCELLED ***')
                return { isIncomplete: false, items: [] }
            }

            const response = await client.generateRecommendations(request).promise()

            request.nextToken = response.nextToken
            this.props.connection.console.info('response:')
            this.props.connection.console.info(JSON.stringify(response, null, 4))

            if (response.recommendations) {
                const responseItems = response.recommendations.map<CompletionItem>(r => {
                    const itemId = count++

                    return {
                        // label: r.content,
                        label: `CodeWhisperer Recommendation`,
                        insertText: r.content,
                        labelDetails: {
                            description: 'CodeWhisperer',
                            detail: ` (${itemId})`,
                        },
                        documentation: r.content,
                        kind: CompletionItemKind.Snippet,
                        filterText: 'aaa CodeWhisperer',
                    }
                })

                items.push(...responseItems)
            }
        } while (request.nextToken !== undefined && request.nextToken !== '')

        const completions: CompletionList = {
            isIncomplete: false,
            items,
        }

        return completions
    }

    doValidation(textDocument: TextDocument): PromiseLike<Diagnostic[]> {
        throw new Error('Method not implemented.')
    }
    doHover(textDocument: TextDocument, position: Position): PromiseLike<Hover | null> {
        throw new Error('Method not implemented.')
    }
    format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[] {
        throw new Error('Method not implemented.')
    }
}

export function create(props: CodeWhispererServiceProps): AwsLanguageService {
    return new CodeWhispererService(props)
}
