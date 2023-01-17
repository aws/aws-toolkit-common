import { HoverParams, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BackendService, LanguageService } from '../../service'

export function service(): LanguageService {
    return {
        completion: (document: TextDocument, textDocumentPositionParams: TextDocumentPositionParams) => {
            return BackendService.getInstance().yaml.doComplete(document, textDocumentPositionParams.position, false)
        },
        diagnostic: (document: TextDocument) => {
            return BackendService.getInstance().yaml.doValidation(document, false)
        },
        hover: (document: TextDocument, params: HoverParams) => {
            return BackendService.getInstance().yaml.doHover(document, params.position)
        }
    }
}
