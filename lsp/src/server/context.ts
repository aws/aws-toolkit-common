import {
    getLanguageService as getJsonLanguageService,
    LanguageService as JsonLanguageService,
} from 'vscode-json-languageservice'
import { Connection } from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageServiceRegistry } from '../service/registry/registry'
import { LanguageServiceStrategy } from '../service/registry/types'
import { LanguageService } from '../service/types'
import { YamlLanguageService, YamlLanguageServiceBuilder } from '../utils/yaml/service'

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

export class Context implements LanguageContext {
    protected readonly fileRegistry: LanguageServiceRegistry
    /**
     *
     */
    constructor(protected readonly connection: Connection, public readonly fileIo: FileIo) {
        this.fileRegistry = new LanguageServiceRegistry()
    }

    public createYamlService(schemaUri: string): LanguageService {
        // TODO : We need to inject the schema resolver into createInnerLanguageService
        const foo = YamlLanguageServiceBuilder.createInnerLanguageService()
        return new YamlLanguageService(schemaUri, foo)
    }

    public createJsonService(): JsonLanguageService {
        return getJsonLanguageService({})
    }

    public get lspConnection(): LspConnection {
        return this.connection
    }

    public register(languageProvider: LanguageServiceStrategy): void {
        this.fileRegistry.addStrategy(languageProvider)
    }
}

export class Context0 extends Context {
    constructor(connection: Connection, fileIo: FileIo = new FileSystemIo()) {
        super(connection, fileIo)
    }

    public async getLanguageService(textDocument: TextDocument): Promise<LanguageService | undefined> {
        return this.fileRegistry.getLanguageService(textDocument)
    }
}
