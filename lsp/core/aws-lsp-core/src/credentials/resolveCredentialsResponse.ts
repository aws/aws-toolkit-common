/**
 * Credentials response provided by langauge server's host
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
