import { resolve } from 'path'
import { HoverParams, TextDocumentPositionParams, URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BackendService, LanguageService } from '../../service'

export function service(uri: URI): LanguageService {
    BackendService.getInstance().json.configure({
        validate: true,
        schemas: [
            {
                fileMatch: [uri],
                // This is a bit weird because the schema is technically contained internally
                uri: `file://${resolve(__dirname, './schema/ssmSchema.json')}`
            }
        ]
    })
    return {
        completion: async (document: TextDocument, textDocumentPositionParams: TextDocumentPositionParams) => {
            const parsedDocument = BackendService.getInstance().json.parseJSONDocument(document)
            const jsonCompletions = await BackendService.getInstance().json.doComplete(
                document,
                textDocumentPositionParams.position,
                parsedDocument
            )

            return jsonCompletions ? jsonCompletions : []
        },
        diagnostic: async (document: TextDocument) => {
            const jsonDocument = BackendService.getInstance().json.parseJSONDocument(document)
            return BackendService.getInstance().json.doValidation(document, jsonDocument)
        },
        hover: (document: TextDocument, params: HoverParams) => {
            const jsonDocument = BackendService.getInstance().json.parseJSONDocument(document)
            return Promise.resolve(BackendService.getInstance().json.doHover(document, params.position, jsonDocument))
        }
    }
}
