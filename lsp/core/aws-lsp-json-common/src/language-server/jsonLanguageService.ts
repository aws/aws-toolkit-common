import { AwsLanguageService, UriResolver } from '@lsp-placeholder/aws-lsp-core'
import { JSONDocument, LanguageService, getLanguageService } from 'vscode-json-languageservice'
import { CompletionList, Diagnostic, FormattingOptions, Hover, Range } from 'vscode-languageserver'
import { Position, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'

export type JsonLanguageServiceProps = {
    defaultSchemaUri?: string
    uriResolver?: UriResolver
}

/**
 * This is a thin wrapper around the VS Code Json Language Service
 * https://github.com/microsoft/vscode-json-languageservice/
 */
export class JsonLanguageService implements AwsLanguageService {
    private jsonService: LanguageService

    constructor(private readonly props: JsonLanguageServiceProps) {
        this.jsonService = getLanguageService({
            schemaRequestService: props.uriResolver?.bind(this),
        })

        const schemas = props.defaultSchemaUri ? [{ fileMatch: ['*.json'], uri: props.defaultSchemaUri }] : undefined

        this.jsonService.configure({ allowComments: false, schemas })
    }

    public isSupported(document: TextDocument): boolean {
        const languageId = document.languageId
        // placeholder-test-json comes from the sample Visual Studio Client (Extension) in the repo
        // see client/visualStudio/IdesLspPoc/ContentDefinitions/JsonContentType.cs
        return languageId === 'json' || languageId === 'placeholder-test-json'
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
