import { CancellationToken } from 'vscode-languageserver'

export interface IamCredentials {
    accessKey: string
    secretKey: string
    token?: string
}

export const credentialsProtocolMethodNames = {
    resolveIamCredentials: '$/aws/credentials/iam',
}

/**
 * Provides components with an encapsulation request credentials from the host
 */
export interface CredentialsProvider {
    resolveIamCredentials(token: CancellationToken): Promise<IamCredentials>
    // TODO : establish a bearer token resolver
}
