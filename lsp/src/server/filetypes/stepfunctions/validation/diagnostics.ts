import { JSONDocument } from 'vscode-json-languageservice'
import { DiagnosticSeverity } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BackendService } from '../../../service'
import { LANGUAGE_IDS } from '../constants/constants'
import { isObjectNode } from '../utils/astUtilityFunctions'
import validateStates from './validateStates'

export async function getDiagnostics(document: TextDocument, doc: JSONDocument) {
    const diagnostics = (await BackendService.getInstance().json.doValidation(document, doc)).map(diagnostic => {
        // Non JSON Schema validation will have source: 'asl'
        if (diagnostic.source !== LANGUAGE_IDS.JSON) {
            return { ...diagnostic, severity: DiagnosticSeverity.Error }
        }

        return diagnostic
    })

    if (doc.root && isObjectNode(doc.root)) {
        const aslDiagnostics = validateStates(doc.root, document, true)
        return diagnostics.concat(aslDiagnostics)
    }

    return diagnostics
}
