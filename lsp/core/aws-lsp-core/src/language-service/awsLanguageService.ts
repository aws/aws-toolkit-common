import { Position, Range, TextDocument, TextEdit } from 'vscode-languageserver-textdocument'
import { CompletionList, Diagnostic, FormattingOptions, Hover } from 'vscode-languageserver-types'

// Where possible, this interface should follow the (VS Code) JSON Language Server's interface, which is close
// to the core (VS Code) language server implementations.
export interface AwsLanguageService {
    isSupported(document: TextDocument): boolean
    doValidation(textDocument: TextDocument): PromiseLike<Diagnostic[]>
    doComplete(textDocument: TextDocument, position: Position): PromiseLike<CompletionList | null>
    doHover(textDocument: TextDocument, position: Position): PromiseLike<Hover | null>
    format(textDocument: TextDocument, range: Range, options: FormattingOptions): TextEdit[]
}
