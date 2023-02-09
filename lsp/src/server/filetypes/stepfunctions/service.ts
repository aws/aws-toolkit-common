import { LanguageService as JSONLanguageService } from 'amazon-states-language-service'
import { HoverParams, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageService } from '../../service'

export function service(service: JSONLanguageService): LanguageService {
    return {
        completion: async (document: TextDocument, textDocumentPositionParams: TextDocumentPositionParams) => {
            const parsedJson = service.parseJSONDocument(document)
            const completion = await service.doComplete(document, textDocumentPositionParams.position, parsedJson)
            return completion ? completion : []
        },
        diagnostic: async (document: TextDocument) => {
            const parsedJson = service.parseJSONDocument(document)
            return service.doValidation(document, parsedJson)
        },
        hover: async (document: TextDocument, params: HoverParams) => {
            const parsedJson = service.parseJSONDocument(document)
            return service.doHover(document, params.position, parsedJson)
        }
    }
}
