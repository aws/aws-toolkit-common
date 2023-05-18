import {
    CompletionItem,
    CompletionList,
    Connection,
    Diagnostic,
    Hover,
    HoverParams,
    TextDocumentPositionParams,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageContext } from '../../../server/context'
import { BaseLanguageService, LanguageService } from '../../types'

const SCHEMA_URL = 'https://d3rrggjwfhwld2.cloudfront.net/CodeBuild/buildspec/buildspec-standalone.schema.json'

export class BuildspecService extends BaseLanguageService {
    private readonly yaml: LanguageService

    constructor(private readonly context: LanguageContext) {
        super()

        this.yaml = context.createYamlService(SCHEMA_URL)
    }

    completion(
        document: TextDocument,
        textDocumentPositionParams: TextDocumentPositionParams
    ): Promise<CompletionItem[] | CompletionList> {
        return this.yaml.completion(document, textDocumentPositionParams)
    }

    diagnostic(document: TextDocument, connection: Connection): Promise<Diagnostic[]> {
        return this.yaml.diagnostic(document, connection)
    }

    hover(document: TextDocument, params: HoverParams): Promise<Hover | null> {
        return this.yaml.hover(document, params)
    }
}
