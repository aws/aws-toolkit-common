// TODO: This is Toolkit specific -- we'd probably move this to a separate package
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'
import { YamlLanguageServer } from '../yamlserver'

const connection = createConnection(ProposedFeatures.all)
export const server = new YamlLanguageServer(connection)
