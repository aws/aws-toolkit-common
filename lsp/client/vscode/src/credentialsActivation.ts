import { fromIni } from '@aws-sdk/credential-providers'
import { AwsCredentialIdentity } from '@aws-sdk/types'
import * as crypto from 'crypto'
import { Writable } from 'stream'
import { ExtensionContext } from 'vscode'
import { CancellationToken, LanguageClient, LanguageClientOptions, RequestType } from 'vscode-languageclient/node'

/**
 * Request for credentials from the langauge server
 */
export interface ResolveCredentialsRequest {
    /**
     * Unique Id of request for IAM Credentials
     */
    requestId: string

    /**
     * When the request was produced, in milliseconds since Unix Epoch
     */
    issuedOn: number
}

/**
 * Credentials response sent to the langauge server
 */
export interface ResolveCredentialsResponse {
    /**
     * Initialization vector for encrypted data, in base64
     */
    iv: string

    /**
     * Encrypted data, in base64. The data contents will vary based on the request made.
     * (eg: The payload is different when requesting IAM vs Bearer token)
     */
    data: string
}

export interface ResolveIamCredentialsResponseData {
    accessKey: string
    secretKey: string
    token?: string
    issuedOn: number // adds variation to the encrypted payload
}

const encryptionKey = crypto.randomBytes(32)

const lspMethodNames = {
    resolveIamCredentials: '$/aws/credentials/iam',
}

const resolveIamRequestType = new RequestType<ResolveCredentialsRequest, ResolveCredentialsResponse, Error>(
    lspMethodNames.resolveIamCredentials
)

export function writeEncryptionInit(stream: Writable): void {
    const payload = {
        version: '1.0',
        key: encryptionKey.toString('base64'),
    }
    stream.write(JSON.stringify(payload))
    stream.write('\n')
}

/**
 * Updates the language client's initialization payload to indicate that it can provide credentials
 * for AWS language servers.
 */
export function configureCredentialsCapabilities(clientOptions: LanguageClientOptions) {
    if (!clientOptions.initializationOptions) {
        clientOptions.initializationOptions = {}
    }

    // This is how we configure the behavior of AWS Language Servers.
    // The structure needs to be formalized across all AWS hosts/extensions.
    //
    // This structure is exploration/conceptual/speculative at this time.
    // See lsp\core\aws-lsp-core\src\initialization\awsInitializationOptions.ts
    clientOptions.initializationOptions.credentials = {
        providesIam: true,
    }
}

/**
 * Registers language clieng callbacks to handle credentials related protocol messages.
 */
export async function registerIamCredentialsProvider(
    languageClient: LanguageClient,
    extensionContext: ExtensionContext
): Promise<void> {
    languageClient.info('Registering credentials provider')
    extensionContext.subscriptions.push(
        ...[
            // Provides the language server with IAM credentials
            languageClient.onRequest<ResolveCredentialsRequest, ResolveCredentialsResponse, Error>(
                resolveIamRequestType,
                async (request: ResolveCredentialsRequest, token: CancellationToken) => {
                    languageClient.info('Client: Credentials have been requested')

                    // Here we would do some validation checks on request
                    // TODO : check request.requestId for uniqueness (eg: maintain a queue that auto-evicts after 5 minutes. Have an upper size limit, evict oldest ids if needed)
                    // TODO : check request.issuedOn for staleness (eg: 10 seconds)

                    // PROOF OF CONCEPT
                    // We will resolve the default profile from the local system.
                    // In a product, the host extension would know which profile it is configured to provide to the language server.
                    const awsCredentials = await fromIni({
                        profile: 'default',
                    })()

                    return createResolveIamCredentialsResponse(awsCredentials)
                }
            ),
        ]
    )
}

/**
 * Creates a response payload that contains encrypted data
 */
function createResolveIamCredentialsResponse(awsCredentials: AwsCredentialIdentity): ResolveCredentialsResponse {
    const responseData: ResolveIamCredentialsResponseData = {
        accessKey: awsCredentials.accessKeyId,
        secretKey: awsCredentials.secretAccessKey,
        token: awsCredentials.sessionToken,
        issuedOn: Date.now(),
    }

    // encrypt payload, create response
    const iv = crypto.randomBytes(16)
    const encoder = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv)

    return {
        iv: iv.toString('base64'),
        data: encoder.update(JSON.stringify(responseData), 'utf-8', 'base64') + encoder.final('base64'),
    }
}
