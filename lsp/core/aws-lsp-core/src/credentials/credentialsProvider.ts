import { CancellationToken } from 'vscode-languageserver'

export interface IamCredentials {
    accessKey: string
    secretKey: string
    token?: string
}

export const credentialsProtocolMethodNames = {
    // Concept: If the server requests credentials from the host on-demand
    resolveIamCredentials: '$/aws/credentials/iam',
    // Concept: If the host pushes credentials to the server whenever credentials state changes
    iamCredentialsUpdate: '$/aws/credentials/iam/update',
    iamCredentialsClear: '$/aws/credentials/iam/clear',
}

/**
 * Provides components with an encapsulation request credentials from the host
 */
export interface CredentialsProvider {
    resolveIamCredentials(token: CancellationToken): Promise<IamCredentials>
    // TODO : establish a bearer token resolver
}
