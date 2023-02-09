import { URI } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { RegistryItem } from '../../registry'
import { service as JsonService } from './json'
import { service as YamlService } from './yaml'

export function activateJSON(): RegistryItem {
    return {
        matches(uri: URI, contents: TextDocument) {
            return uri.endsWith('.ssm.json')
        },
        onMatch(uri: URI) {
            return JsonService(uri)
        }
    }
}

export function activateYAML(): RegistryItem {
    return {
        matches(uri: URI, contents: TextDocument) {
            return uri.endsWith('.ssm.yml') || uri.endsWith('.ssm.yaml')
        },
        onMatch(uri: URI) {
            return YamlService(uri)
        }
    }
}
