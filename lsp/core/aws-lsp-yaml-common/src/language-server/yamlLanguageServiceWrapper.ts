import { SchemaProvider } from '@lsp-placeholder/aws-lsp-core'
import { CompletionList, Diagnostic, Hover, Position, TextEdit } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { CustomFormatterOptions, LanguageService, getLanguageService } from 'yaml-language-server'

export type YamlLanguageServiceWrapperProps = {
    displayName: string
    defaultSchemaUri: string
    schemaProvider: SchemaProvider
}

export class YamlLanguageServiceWrapper {
    private yamlService: LanguageService

    public static isLangaugeIdSupported(languageId: string): boolean {
        return languageId === 'yaml'
    }

    constructor(private readonly props: YamlLanguageServiceWrapperProps) {
        const workspaceContext = {
            resolveRelativePath(relativePath: string, resource: string) {
                return new URL(relativePath, resource).href
            },
        }

        this.yamlService = getLanguageService({
            schemaRequestService: this.props.schemaProvider,
            workspaceContext,
        })

        this.yamlService.configure({ schemas: [{ fileMatch: ['*.yml'], uri: this.props.defaultSchemaUri }] })
    }

    public doValidation(document: TextDocument): Promise<Diagnostic[]> {
        this.updateSchemaMapping(document.uri)
        return this.yamlService.doValidation(document, false)
    }

    public doComplete(document: TextDocument, position: Position): Promise<CompletionList> {
        this.updateSchemaMapping(document.uri)
        return this.yamlService.doComplete(document, position, false)
    }

    public doHover(document: TextDocument, position: Position): Promise<Hover | null> {
        this.updateSchemaMapping(document.uri)
        return this.yamlService.doHover(document, position)
    }

    public doFormat(document: TextDocument, options: CustomFormatterOptions): TextEdit[] {
        this.updateSchemaMapping(document.uri)
        return this.yamlService.doFormat(document, options)
    }

    private updateSchemaMapping(documentUri: string): void {
        this.yamlService.configure({
            hover: true,
            completion: true,
            validate: true,
            customTags: [],
            schemas: [
                {
                    fileMatch: [documentUri],
                    uri: this.props.defaultSchemaUri,
                    name: this.props.displayName,
                    description: 'some description,',
                },
            ],
        })
    }
}
