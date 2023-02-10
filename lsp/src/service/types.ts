import {
    CompletionItem,
    CompletionList,
    Diagnostic,
    Hover,
    HoverParams,
    TextDocumentPositionParams
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export interface LanguageService {
    completion: (
        document: TextDocument,
        textDocumentPosition: TextDocumentPositionParams
    ) => Promise<CompletionItem[] | CompletionList>
    diagnostic: (document: TextDocument) => Promise<Diagnostic[]>
    hover: (document: TextDocument, params: HoverParams) => Promise<Hover | null>
}
