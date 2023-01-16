import {
    CompletionItem,
    CompletionList,
    createConnection,
    DidChangeConfigurationNotification,
    Hover,
    HoverParams,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind
} from 'vscode-languageserver/node'

import { TextDocument } from 'vscode-languageserver-textdocument'
import { activate as BuildspecActivation } from './filetypes/buildspec/activation'
import { Registry } from './registry'
import { LanguageService } from 'yaml-language-server'

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all)

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument)

const fileRegistry = Registry.getInstance()
fileRegistry.addRegistryItem(BuildspecActivation())

let hasConfigurationCapability = false
let hasWorkspaceFolderCapability = false
let hasDiagnosticRelatedInformationCapability = false

connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities

    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration)
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders)
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    )

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: false
            }
        }
    }
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        }
    }
    return result
})

connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined)
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.')
        })
    }
})

connection.onDidChangeConfiguration(change => {
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument)
})

// Only keep settings for open documents
// eslint-disable-next-line @typescript-eslint/no-empty-function
documents.onDidClose(e => {})

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
    validateTextDocument(change.document)
})

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] })
}

connection.onDidChangeWatchedFiles(_change => {
    connection.console.log('We received an file change event')
})

connection.onCompletion(
    async (textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[] | CompletionList> => {
        const textDoc = documents.get(textDocumentPosition.textDocument.uri)
        if (textDoc === undefined) { return [] }
        const service = fileRegistry.getMatch(textDocumentPosition.textDocument.uri, textDoc)
        if (service === undefined) { return [] }
        return service.completion(textDoc, textDocumentPosition)
    }
)

connection.onHover(
    async (params: HoverParams): Promise<Hover | undefined> => {
        const textDoc = documents.get(params.textDocument.uri)
        if (textDoc === undefined) { return undefined }
        const service = fileRegistry.getMatch(params.textDocument.uri, textDoc)
        if (service === undefined) { return undefined }
        return service.hover(textDoc, params)
    }
)

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection)

// Listen on the connection
connection.listen()
