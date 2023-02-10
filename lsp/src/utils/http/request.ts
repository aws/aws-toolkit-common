
import { Headers, XHROptions, XHRResponse, xhr } from 'request-light'



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
    
    constructor(private readonly requestImpl = xhr) {}

    /** Sends a http request */
    request(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
        return this.requestImpl({ url, ...options })
    }
}
