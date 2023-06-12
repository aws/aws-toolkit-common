import {
    CloudFormationServer,
    CloudFormationServerProps,
    CloudFormationServiceProps,
    createCloudFormationService,
    jsonSchemaUrl,
} from '@lsp-placeholder/aws-lsp-cloudformation'
import {
    CachedContentHandler,
    FileHandler,
    HttpHandler,
    SchemaProvider,
    SchemaProviderBuilder,
    UriCacheRepository,
    httpsUtils,
} from '@lsp-placeholder/aws-lsp-core'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

function createSchemaProvider(): SchemaProvider {
    const builder = new SchemaProviderBuilder()

    const cacheRepository = new UriCacheRepository()

    builder.addHandler(new FileHandler())

    builder.addHandler(
        new CachedContentHandler({
            cacheRepository: cacheRepository,
        })
    )
    builder.addHandler(new HttpHandler())

    return builder.build()
}

const connection = createConnection(ProposedFeatures.all)

const serviceProps: CloudFormationServiceProps = {
    displayName: CloudFormationServer.serverId,
    defaultSchemaUri: jsonSchemaUrl,
    schemaProvider: createSchemaProvider(),
}

const cloudformationService = createCloudFormationService(serviceProps)

const props: CloudFormationServerProps = {
    connection,
    cloudformationService: cloudformationService,
}

async function getFileAsync(url: string): Promise<string> {
    return await httpsUtils.requestContent(url)
}

export const server = new CloudFormationServer(props)
