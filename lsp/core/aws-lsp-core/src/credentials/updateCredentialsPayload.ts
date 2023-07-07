/**
 * Payload for custom notification "Update Credentials"
 * Used by the host to send resolved credentials
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
