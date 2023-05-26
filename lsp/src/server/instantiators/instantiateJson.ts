// TODO: This is Toolkit specific -- we'd probably move this to a separate package
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'
import { JSONLanguageServer } from '../jsonServer'

const connection = createConnection(ProposedFeatures.all)
export const server = new JSONLanguageServer(connection)
