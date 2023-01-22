
import { Headers, XHROptions, XHRRequest, XHRResponse, xhr } from 'request-light'



// Abstract away interfaces of existing implementations
export type HttpRequestOptions = Pick<XHROptions, 'headers'>
export type HttpRequestHeaders = Headers
export type HttpResponse = XHRResponse

export interface HttpRequesterI {
    request(url: string, options?: HttpRequestOptions): Promise<HttpResponse>
}
/**
 * Abstracted http request class.
 * 
 * This will ensure we are not locked in to a specific
 * http request implementation.
 */
export class HttpRequester implements HttpRequesterI {
    private requestImpl: XHRRequest

    constructor(requestImpl = xhr) {
        this.requestImpl = requestImpl
    }

    /** Sends a http request */
    request(url: string, options?: HttpRequestOptions): Promise<HttpResponse> {
        if (options === undefined) {
            return this.requestImpl({ url })
        }
        return this.requestImpl({ url, ...options })
    }
}
