import { resolve } from 'path'
import { DiagnosticSeverity, HoverParams, TextDocumentPositionParams, URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BackendService, LanguageService } from '../../service'
import completeAsl from './completion/completeAsl'
import { LANGUAGE_IDS } from './constants/constants'
import { getASLDiagnostics } from './validation/diagnostics'

export function service(uri: URI): LanguageService {
    BackendService.getInstance().json.configure({
        validate: true,
        schemas: [
            {
                fileMatch: [uri],
                // This is a bit weird because the schema is technically contained internally
                uri: `file://${resolve(__dirname, './json-schema/bundled.json')}`
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

            return completeAsl(document, textDocumentPositionParams.position, parsedDocument, jsonCompletions)
        },
        diagnostic: async (document: TextDocument) => {
            const jsonDocument = BackendService.getInstance().json.parseJSONDocument(document)

            // vscode-json-languageservice will always set severity as warning for JSONSchema validation
            // there is no option to configure this behavior so severity needs to be overwritten as error
            const diagnostics = await (
                await BackendService.getInstance().json.doValidation(document, jsonDocument)
            ).map(diagnostic => {
                // Non JSON Schema validation will have source: 'asl'
                if (diagnostic.source !== LANGUAGE_IDS.ASL_JSON) {
                    return { ...diagnostic, severity: DiagnosticSeverity.Error }
                }
                return diagnostic
            })

            return diagnostics.concat(getASLDiagnostics(document, jsonDocument))
        },
        hover: (document: TextDocument, params: HoverParams) => {
            const jsonDocument = BackendService.getInstance().json.parseJSONDocument(document)
            return Promise.resolve(BackendService.getInstance().json.doHover(document, params.position, jsonDocument))
        }
    }
}
