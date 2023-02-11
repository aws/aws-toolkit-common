import { JSONDocument, TextDocument } from 'vscode-json-languageservice'
import { createLanguageService } from '../json/service'

const jsonService = createLanguageService()

export function parseJson(td: TextDocument): JSONDocument {
    return jsonService.parseJSONDocument(td)
}

