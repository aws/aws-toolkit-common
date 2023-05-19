import { BaseLanguageService, LanguageContext, LanguageService } from 'lsp-base'
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
import { JsonLanguageService } from '../../../utils/json/service'
import { DocumentParser } from '../../../utils/parser/document'
import { DocumentParserVisitor } from '../../../utils/parser/types'

const SCHEMA_URL = 'https://my.website.com/schema.js'

export class BoilerplateService extends BaseLanguageService {
    private parser: DocumentParserVisitor
    private readonly yaml: LanguageService
    private json: JsonLanguageService

    constructor(private readonly context: LanguageContext, parser: DocumentParserVisitor = new DocumentParser()) {
        super()

        // Use this if you need an AST
        this.parser = parser

        // Use this if you need to access the YAML Language Service
        this.yaml = this.context.createYamlService(SCHEMA_URL)

        // Use this if you need to access the JSON Language Service
        this.json = this.context.createJsonService()
    }

    completion(
        document: TextDocument,
        textDocumentPositionParams: TextDocumentPositionParams
    ): Promise<CompletionItem[] | CompletionList> {
        return Promise.resolve([])
    }

    diagnostic(document: TextDocument, connection: Connection): Promise<Diagnostic[]> {
        return Promise.resolve([])
    }

    hover(document: TextDocument, params: HoverParams): Promise<Hover | null> {
        return Promise.resolve(null)
    }
}
