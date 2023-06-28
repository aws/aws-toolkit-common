/**
 * Used to request credentials from the langauge server's host
 */
export interface ResolveCredenitalsRequest {
    /**
     * Unique Id of request for IAM Credentials
     */
    requestId: string

    /**
     * When the request was produced, in milliseconds since Unix Epoch
     */
    issuedOn: number
}
