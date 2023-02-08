import { JSONDocument } from 'vscode-json-languageservice'
import { Diagnostic } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { ASLOptions, isObjectNode } from '../utils/astUtilityFunctions'
import validateStates from './validateStates'

export function getASLDiagnostics(document: TextDocument, doc: JSONDocument, options?: ASLOptions): Diagnostic[] {
    if (doc.root && isObjectNode(doc.root)) {
        const aslDiagnostics = validateStates(doc.root, document, true, options)
        return aslDiagnostics
    }

    return []
}
