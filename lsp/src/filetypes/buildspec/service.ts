import { HoverParams, TextDocumentPositionParams } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BackendService, LanguageService } from '../../service'

export function service(): LanguageService {
    return {
        completion: (textDocument: TextDocument, textDocumentPositionParams: TextDocumentPositionParams) => {
            return BackendService.getInstance().yaml.doComplete(
                textDocument,
                textDocumentPositionParams.position,
                false
            )
        },
        hover: (textDocument: TextDocument, params: HoverParams) => {
            return BackendService.getInstance().yaml.doHover(textDocument, params.position)
        }
    }
}
