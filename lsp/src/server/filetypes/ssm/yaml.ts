import { resolve } from 'path'
import { HoverParams, TextDocumentPositionParams, URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BackendService, LanguageService } from '../../service'

export function service(uri: URI): LanguageService {
    BackendService.getInstance().yaml.configure({
        hover: true,
        completion: true,
        validate: true,
        customTags: [],
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
            return BackendService.getInstance().yaml.doComplete(document, textDocumentPositionParams.position, false)
        },
        diagnostic: async (document: TextDocument) => {
            return await BackendService.getInstance().yaml.doValidation(document, false)
        },
        hover: (document: TextDocument, params: HoverParams) => {
            return BackendService.getInstance().yaml.doHover(document, params.position)
        }
    }
}
