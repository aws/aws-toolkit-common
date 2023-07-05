/**
 * Proof of Concept: We are evaluating how we want language server to receive
 * credentials. In production, there will only be one approach.
 */
export enum CredentialsDirectionConcept {
    /**
     * language server should pull credentials from the extension whenever it needs
     */
    serverPull,
    /**
     * credendials should be pushed by the extension as credentials state changes
     */
    extPush,
}

/**
 * The (optional) initialization options shape expected by
 * clients supporting AWS LSPs.
 *
 * This structure is exploration/conceptual/speculative at this time.
 */
export interface AwsInitializationOptions {
    credentials?: {
        providesIam?: boolean
        providesBearerToken?: boolean
        credentialsDirection: CredentialsDirectionConcept
    }
}
