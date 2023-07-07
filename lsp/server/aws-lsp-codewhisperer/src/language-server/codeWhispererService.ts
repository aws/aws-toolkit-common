import { AwsLanguageService } from '@lsp-placeholder/aws-lsp-core'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
import { CancellationToken, CompletionItem, CompletionItemKind, Connection } from 'vscode-languageserver'
import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'
import { createCodeWhispererClient } from '../client/codewhisperer'
import {
    InlineCompletionContext,
    InlineCompletionItem,
    InlineCompletionList,
    InlineCompletionTriggerKind,
} from '../inline/futureTypes'
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

interface DoInlineCompletionParams {
    textDocument: TextDocument
    position: Position
    context: InlineCompletionContext
    token: CancellationToken
}

interface GetRcommendationsParams {
    textDocument: TextDocument
    position: Position
    maxResults: number
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

    // TODO : Design notes : We may want to change the AwsLanguageService signatures
    // to provide more details coming in through the LSP event.
    // In this case, we also want access to the cancellation token.
    async doComplete2(params: CompletionParams): Promise<CompletionList | null> {
        const recommendations = await this.getRecommendations({
            textDocument: params.textDocument,
            position: params.position,
            maxResults: 5,
            token: params.token,
        })

        let count = 1
        let items: CompletionItem[] = recommendations.map<CompletionItem>(r => {
            const itemId = count++

            return {
                // We don't just stick the recommendation into the completion list,
                // because multi-line recommendations don't render nicely.
                // Lean into the "documentation" instead to show the "preview"
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

        const completions: CompletionList = {
            isIncomplete: false,
            items,
        }

        return completions
    }

    // TODO : Design notes : What would the AwsLanguageService signature look like?
    async doInlineCompletion(params: DoInlineCompletionParams): Promise<InlineCompletionList | null> {
        const recommendations = await this.getRecommendations({
            textDocument: params.textDocument,
            position: params.position,
            maxResults: params.context.triggerKind == InlineCompletionTriggerKind.Automatic ? 1 : 5,
            token: params.token,
        })

        let items: InlineCompletionItem[] = recommendations.map<InlineCompletionItem>(r => {
            return {
                insertText: r.content,
                range: params.context.selectedCompletionInfo?.range,
            }
        })

        const completions: InlineCompletionList = {
            items,
        }

        return completions
    }

    private async getRecommendations(params: GetRcommendationsParams): Promise<CodeWhispererClient.Recommendation[]> {
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
            maxResults: params.maxResults,
        }

        const results: CodeWhispererClient.Recommendation[] = []

        // We will get all the paginated recommendations.
        // This is slow, and holds up the IDE's autocompletion list from showing.
        // We wouldn't do this in a release.
        do {
            if (params.token.isCancellationRequested) {
                this.props.connection.console.info('*** CANCELLED ***')
                return []
            }

            const response = await client.generateRecommendations(request).promise()

            request.nextToken = response.nextToken

            if (response.recommendations) {
                results.push(...response.recommendations)
            }
        } while (request.nextToken !== undefined && request.nextToken !== '' && results.length < params.maxResults)

        return results
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
