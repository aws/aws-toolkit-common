import { LanguageService as JsonLanguageService } from 'vscode-json-languageservice'
import { Connection } from 'vscode-languageserver'
import { LanguageServiceStrategy } from './service/registry/types'
import { LanguageService } from './service/types'

export interface FileIo {
    readFile(path: string): string
}

export class FileSystemIo implements FileIo {
    public readFile(path: string): string {
        return 'file contents'
    }
}

export interface LanguageContext {
    fileIo: FileIo
    lspConnection: LspConnection
    createYamlService(schemaUri: string): LanguageService
    createJsonService(): JsonLanguageService
    register(languageProvider: LanguageServiceStrategy): void
}

// We don't want services to access connection and override the main events like onCompletion.
// TODO : implementors could still get to Connection from (eg) foo.window.connection.
// Maybe we can't use Pick here
export type LspConnection = Pick<
    Connection,
    | 'sendRequest'
    | 'sendNotification'
    | 'onInitialized'
    | 'onShutdown'
    | 'onExit'
    | 'console'
    | 'tracer'
    | 'window'
    | 'workspace'
    | 'languages'
>

// Note: wrapping all the connection things that we'd want to surface is a good idea
