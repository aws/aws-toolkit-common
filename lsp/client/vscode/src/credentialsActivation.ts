import { fromIni } from '@aws-sdk/credential-providers'
import { AwsCredentialIdentity } from '@aws-sdk/types'
import * as crypto from 'crypto'
import { Writable } from 'stream'
import { ExtensionContext, commands, window } from 'vscode'
import { LanguageClient, LanguageClientOptions, NotificationType } from 'vscode-languageclient/node'

/**
 * Payload for custom notification "Update Credentials"
 */
export interface UpdateCredentialsPayload {
    /**
     * Initialization vector for encrypted data, in base64
     */
    iv: string

    /**
     * Encrypted data, in base64. The data contents will vary based on the notification used.
     * (eg: The payload is different for IAM vs Bearer token)
     */
    data: string
    /**
     * Encrypted data's authTag - used for decryption validation
     */
    authTag: string
}

export interface UpdateIamCredentialsPayloadData {
    accessKeyId: string
    secretAccessKey: string
    sessionToken?: string
}

const encryptionKey = crypto.randomBytes(32)

// See core\aws-lsp-core\src\credentials\credentialsProvider.ts for the server's
// custom method names and intents.
const lspMethodNames = {
    iamCredentialsUpdate: '$/aws/credentials/iam',
    iamCredentialsClear: '$/aws/credentials/iam/clear',
}

const notificationTypes = {
    updateIamCredentials: new NotificationType<UpdateCredentialsPayload>(lspMethodNames.iamCredentialsUpdate),
    clearIamCredentials: new NotificationType(lspMethodNames.iamCredentialsClear),
}

/**
 * Sends a json payload to the language server, who is waiting to know what the encryption key is.
 */
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

export async function registerIamCredentialsProviderSupport(
    languageClient: LanguageClient,
    extensionContext: ExtensionContext
): Promise<void> {
    extensionContext.subscriptions.push(
        ...[
            commands.registerCommand('awslsp.selectProfile', createSelectProfileCommand(languageClient)),
            commands.registerCommand('awslsp.clearProfile', createClearProfileCommand(languageClient)),
        ]
    )
}

/**
 * This command simulates an extension's credentials state changing, and pushing updated
 * credentials to the server.
 *
 * In this simulation, the user is asked for a profile name. That profile's credentials are
 * resolved and sent. (basic profile types only in this proof of concept)
 */
function createSelectProfileCommand(languageClient: LanguageClient) {
    return async () => {
        const profileName = await window.showInputBox({
            prompt: 'Which credentials profile should the language server use?',
        })

        // PROOF OF CONCEPT
        // We will resolve the default profile from the local system.
        // In a product, the host extension would know which profile it is configured to provide to the language server.
        const awsCredentials = await fromIni({
            profile: profileName,
        })()

        const payload = createUpdateIamCredentialsPayload(awsCredentials)
        await sendIamCredentialsUpdate(payload, languageClient)

        languageClient.info(`Client: The language server is now using credentials profile: ${profileName}`)
    }
}

/**
 * Creates a response payload that contains encrypted data
 */
function createUpdateIamCredentialsPayload(awsCredentials: AwsCredentialIdentity): UpdateCredentialsPayload {
    const responseData: UpdateIamCredentialsPayloadData = {
        accessKeyId: awsCredentials.accessKeyId,
        secretAccessKey: awsCredentials.secretAccessKey,
        sessionToken: awsCredentials.sessionToken,
    }

    // encrypt payload, create response
    const iv = crypto.randomBytes(16)
    const encoder = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv, {
        authTagLength: 16,
    })
    const data = encoder.update(JSON.stringify(responseData), 'utf-8', 'base64') + encoder.final('base64')
    const authTag = encoder.getAuthTag().toString('base64')

    return {
        iv: iv.toString('base64'),
        data,
        authTag,
    }
}

function sendIamCredentialsUpdate(payload: UpdateCredentialsPayload, languageClient: LanguageClient): Promise<void> {
    return languageClient.sendNotification(notificationTypes.updateIamCredentials, payload)
}

/**
 * This command simulates an extension's credentials expiring (or the user configuring "no credentials").
 *
 * The server's credentials are cleared.
 */
function createClearProfileCommand(languageClient: LanguageClient) {
    return async () => {
        await languageClient.sendNotification(notificationTypes.clearIamCredentials)
    }
}
