import { URI } from 'vscode-uri'
import { DefaultHttpRequester, HttpRequestHeaders, HttpRequester, getETag } from '../../http/requesters'
import { ContentRequestMiddleware, ContentRequestMiddlewareDelegate } from '../contentRequestMiddleware'
import { ContentRequestResponse } from '../contentRequestResponse'

export class HttpHandler implements ContentRequestMiddleware {
    constructor(readonly httpContentDownloader: HttpRequester = new DefaultHttpRequester()) {}

    /**
     * Downloads the content of a HTTP uri.
     *
     * Additionally if an eTag is provided it will use it in the request.
     * In the scenario the eTag matches the destinations, the content
     * returned will be undefined.
     *
     * In any other scenario an error will be thrown.
     * @param uri
     * @param eTag
     * @returns text content and eTag if it exists, on undefined content it is an eTag match
     */
    async get(uri: URI, next: ContentRequestMiddlewareDelegate): Promise<ContentRequestResponse> {
        if (!uri.scheme.startsWith('http')) {
            // we only know how to handle http(s) requests. Go to the next handler.
            return next(uri)
        }

        let headers: HttpRequestHeaders = {}

        // if (eTag !== undefined) {
        //     // 'If-None-Match' Header induces 304 status if ETag value matches the remote's.
        //     // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
        //     headers = { 'If-None-Match': eTag }
        // }

        // Request uri data
        try {
            const response = await this.httpContentDownloader.request(uri.toString(), { headers })
            const latestETag = getETag(response.headers)
            return { content: response.responseText, eTag: latestETag }
        } catch (err) {
            // if ((err as HttpResponse).status == 304) {
            //     // The current http request library throws an error on,
            //     // I'm assuming non 200 status codes, so we need to catch this
            //     // case. If we can disable the exception this try/catch can be removed.

            //     // Requested data matches our cache.
            //     return { content: undefined, eTag }
            // }
            throw err
        }
    }
}
