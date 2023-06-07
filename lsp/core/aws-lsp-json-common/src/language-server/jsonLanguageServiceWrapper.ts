import { SchemaProvider } from '@lsp-placeholder/aws-lsp-core'
import { JSONDocument, LanguageService, getLanguageService } from 'vscode-json-languageservice'
import { CompletionList, Diagnostic, FormattingOptions, Hover, Range } from 'vscode-languageserver'
import { Position, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'

export type JsonLanguageServiceWrapperProps = {
    defaultSchemaUri?: string
    schemaProvider?: SchemaProvider
}

export class JsonLanguageServiceWrapper {
    private jsonService: LanguageService

    public static isLangaugeIdSupported(languageId: string): boolean {
        return languageId === 'json' || languageId === 'christou-test-json'
    }

    constructor(private readonly props: JsonLanguageServiceWrapperProps) {
        this.jsonService = getLanguageService({
            schemaRequestService: props.schemaProvider?.bind(this),
        })

        const schemas = props.defaultSchemaUri ? [{ fileMatch: ['*.json'], uri: props.defaultSchemaUri }] : undefined

        this.jsonService.configure({ allowComments: false, schemas })
    }

    public doValidation(textDocument: TextDocument): Thenable<Diagnostic[]> {
        const jsonDocument = this.parse(textDocument)

        return this.jsonService.doValidation(textDocument, jsonDocument)
    }

    public doComplete(textDocument: TextDocument, position: Position): Thenable<CompletionList | null> {
        const jsonDocument = this.parse(textDocument)

        return this.jsonService.doComplete(textDocument, position, jsonDocument)
    }

    public doHover(textDocument: TextDocument, position: Position): Thenable<Hover | null> {
        const jsonDocument = this.parse(textDocument)

        return this.jsonService.doHover(textDocument, position, jsonDocument)
    }

    public format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[] {
        return this.jsonService.format(textDocument, range, options)
    }

    private parse(textDocument: TextDocument): JSONDocument {
        const jsonDocument = this.jsonService.parseJSONDocument(textDocument)

        if (!jsonDocument) {
            throw new Error(`Unable to parse document with uri: ${textDocument.uri}`)
        }

        return jsonDocument
    }
}
