// import {
//     FileIo,
//     FileSystemIo,
//     LanguageContext,
//     LanguageService,
//     LanguageServiceStrategy,
//     LspConnection,
// } from 'lsp-base'
// import { Connection } from 'vscode-languageserver'
// import { TextDocument } from 'vscode-languageserver-textdocument'
// import { URI } from 'vscode-uri'
// import { SchemaRequestService, getJSONLanguageService } from 'yaml-language-server'
// import { JsonLanguageService } from '../utils/json/service'
// import { UriContentResolver } from '../utils/uri/resolve'
// import { YamlLanguageService, YamlLanguageServiceBuilder } from '../utils/yaml/service'
// import { LanguageServiceRegistry } from './registry/registry'

// export abstract class Context implements LanguageContext {
//     protected readonly fileRegistry: LanguageServiceRegistry
//     /**
//      *
//      */
//     constructor(protected readonly connection: Connection, public readonly fileIo: FileIo) {
//         this.fileRegistry = new LanguageServiceRegistry()
//     }

//     public createYamlService(schemaUri: string): LanguageService {
//         // TODO : We need to inject the schema resolver into createInnerLanguageService
//         const foo = YamlLanguageServiceBuilder.createInnerLanguageService(this.createYamlSchemaRequestService())
//         return new YamlLanguageService(schemaUri, foo)
//     }

//     public createJsonService(): JsonLanguageService {
//         return getJSONLanguageService({})
//     }

//     public get lspConnection(): LspConnection {
//         return this.connection
//     }

//     public register(languageProvider: LanguageServiceStrategy): void {
//         this.fileRegistry.addStrategy(languageProvider)
//     }

//     protected abstract createYamlSchemaRequestService(): SchemaRequestService
// }

// // todo : this stays out of the core
// export class Context0 extends Context {
//     constructor(connection: Connection, fileIo: FileIo = new FileSystemIo()) {
//         super(connection, fileIo)
//     }

//     public async getLanguageService(textDocument: TextDocument): Promise<LanguageService | undefined> {
//         return this.fileRegistry.getLanguageService(textDocument)
//     }

//     protected createYamlSchemaRequestService(): SchemaRequestService {
//         const uriResolver = new UriContentResolver()
//         const schemaResolver: SchemaRequestService = (uri: string) => {
//             return uriResolver.getContent(URI.parse(uri))
//         }

//         return schemaResolver
//     }
// }
