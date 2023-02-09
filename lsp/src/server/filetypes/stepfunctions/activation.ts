import { getLanguageService, getYamlLanguageService } from 'amazon-states-language-service'
import { URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { RegistryItem } from '../../registry'
import { service } from './service'

export function activateJson(): RegistryItem {
    const jsonService = getLanguageService({})
    return {
        matches(uri: URI, contents: TextDocument) {
            return uri.endsWith('.asl.json')
        },
        onMatch(uri: URI) {
            return service(jsonService)
        }
    }
}

export function activateYAML(): RegistryItem {
    const yamlService = getYamlLanguageService({})
    return {
        matches(uri: URI, contents: TextDocument) {
            return uri.endsWith('.asl.yml') || uri.endsWith('.asl.yaml')
        },
        onMatch(uri: URI) {
            return service(yamlService)
        }
    }
}
