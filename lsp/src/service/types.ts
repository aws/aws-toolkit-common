import {
    CompletionItem,
    CompletionList,
    Diagnostic,
    Hover,
    HoverParams,
    TextDocumentPositionParams
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'

export class BaseLanguageService implements LanguageService{
    completion(document: TextDocument, textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList | CompletionItem[]> {
        throw new Error(`completion() not implemented for this Service.`)
    }
    diagnostic(document: TextDocument): Promise<Diagnostic[]> {
        throw new Error(`diagnostic() not implemented for this Service.`)
    }
    hover(document: TextDocument, params: HoverParams): Promise<Hover | null> {
        throw new Error(`hover() not implemented for this Service.`)
    }
}


export interface LanguageService {
    completion: (
        document: TextDocument,
        textDocumentPosition: TextDocumentPositionParams
    ) => Promise<CompletionItem[] | CompletionList>
    diagnostic: (document: TextDocument) => Promise<Diagnostic[]>
    hover: (document: TextDocument, params: HoverParams) => Promise<Hover | null>
}
