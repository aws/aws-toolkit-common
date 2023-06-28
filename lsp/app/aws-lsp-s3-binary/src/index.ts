import { AwsInitializationOptions } from '@lsp-placeholder/aws-lsp-core'
import {
    IdeCredentialsProvider,
    S3Server,
    S3ServerProps,
    S3ServiceProps,
    createS3ervice,
} from '@lsp-placeholder/aws-lsp-s3'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

const connection = createConnection(ProposedFeatures.all)

const credentialsProvider = new IdeCredentialsProvider(connection)

const serviceProps: S3ServiceProps = {
    displayName: S3Server.serverId,
    credentialsProvider,
}

const service = createS3ervice(serviceProps)

const props: S3ServerProps = {
    connection,
    s3Service: service,
    onInitialize: (props: AwsInitializationOptions) => {
        credentialsProvider.initialize(props)
    },
}

export const server = new S3Server(props)
