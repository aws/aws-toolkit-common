import * as crypto from 'crypto'
import { CancellationToken, Connection, RequestType } from 'vscode-languageserver'
import { CredentialsProvider, IamCredentials, credentialsProtocolMethodNames } from './credentialsProvider'
import { ResolveCredentialsRequest } from './resolveCredentialsRequest'
import { ResolveCredentialsResponse } from './resolveCredentialsResponse'

/**
 * Requests credentials from IDE extensions, and decrypts the responses for use by language server components.
 *
 * PROOF OF CONCEPT: Browser hosts might have a more simplified provider, assuming they already have credentials available.
 */
export class IdeCredentialsProvider implements CredentialsProvider {
    private readonly resolveIamRequestType = new RequestType<
        ResolveCredentialsRequest,
        ResolveCredentialsResponse,
        Error
    >(credentialsProtocolMethodNames.resolveIamCredentials)

    private key: Buffer | undefined

    constructor(private readonly connection: Connection, key?: string) {
        if (key) {
            this.key = Buffer.from(key, 'base64')
            this.connection.console.info('Server: I was initialized with an encryption key')
        } else {
            this.connection.console.info("Server: I didn't get an encryption key. Functionality will be limited.")
        }
    }

    /**
     * Requests credentials from host
     */
    public async resolveIamCredentials(token: CancellationToken): Promise<IamCredentials> {
        this.connection.console.info('Server: Requesting Credentials...')

        const request: ResolveCredentialsRequest = {
            requestId: crypto.randomUUID(),
            issuedOn: new Date().valueOf(),
        }

        const credentials = await this.getCredentialsFromHost(request, token)

        this.connection.console.info('Server: Done Requesting Credentials')

        return credentials
    }

    private async getCredentialsFromHost(
        request: ResolveCredentialsRequest,
        token: CancellationToken
    ): Promise<IamCredentials> {
        // Call out to the IDE for credentials
        const response = await this.connection.sendRequest(this.resolveIamRequestType, request, token)

        const responseData = this.decryptResponseData(response)
        return JSON.parse(responseData) as IamCredentials
    }

    private decryptResponseData(response: ResolveCredentialsResponse): string {
        if (!this.key) {
            throw new Error('no encryption key')
        }

        const iv = Buffer.from(response.iv, 'base64')

        const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv)
        return decipher.update(response.data, 'base64', 'utf8') + decipher.final('utf8')
    }
}
