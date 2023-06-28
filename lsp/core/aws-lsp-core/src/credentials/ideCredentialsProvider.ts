import * as crypto from 'crypto'
import { CancellationToken, Connection, RequestType } from 'vscode-languageserver'
import { AwsInitializationOptions } from '../initialization/awsInitializationOptions'
import { CredentialsProvider, IamCredentials, credentialsProtocolMethodNames } from './credentialsProvider'
import { ResolveCredenitalsRequest } from './resolveCredenitalsRequest'
import { ResolveCredenitalsResponse } from './resolveCredenitalsResponse'

/**
 * Requests credentials from IDE extensions, and decrypts the responses for use by language server components.
 *
 * PROOF OF CONCEPT: Browser hosts might have a more simplified provider, assuming they already have credentials available.
 */
export class IdeCredentialsProvider implements CredentialsProvider {
    private readonly resolveIamRequestType = new RequestType<
        ResolveCredenitalsRequest,
        ResolveCredenitalsResponse,
        Error
    >(credentialsProtocolMethodNames.resolveIamCredentials)

    private key: Buffer | undefined

    constructor(private readonly connection: Connection) {}

    /**
     * Obtains the encryption key, which is provided by the host during LSP initialization.
     * Intended to be called when the language server is initialized.
     */
    public initialize(props: AwsInitializationOptions) {
        if (props.credentials?.providerKey) {
            this.key = Buffer.from(props.credentials.providerKey, 'base64')
        }
    }

    /**
     * Requests credentials from host
     */
    public async resolveIamCredentials(token: CancellationToken): Promise<IamCredentials> {
        this.connection.console.info('Requesting Credentials')

        const request: ResolveCredenitalsRequest = {
            requestId: crypto.randomUUID(),
            issuedOn: new Date().valueOf(),
        }

        const credentials = await this.getCredentialsFromHost(request, token)

        this.connection.console.info('DONE Requesting Credentials')

        return credentials
    }

    private async getCredentialsFromHost(
        request: ResolveCredenitalsRequest,
        token: CancellationToken
    ): Promise<IamCredentials> {
        // Call out to the IDE for credentials
        const response = await this.connection.sendRequest(this.resolveIamRequestType, request, token)

        const responseData = this.decryptResponseData(response)
        return JSON.parse(responseData) as IamCredentials
    }

    private decryptResponseData(response: ResolveCredenitalsResponse): string {
        if (!this.key) {
            throw new Error('no encryption key')
        }

        const iv = Buffer.from(response.iv, 'base64')

        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv)
        return decipher.update(response.data, 'base64', 'utf8') + decipher.final('utf8')
    }
}
