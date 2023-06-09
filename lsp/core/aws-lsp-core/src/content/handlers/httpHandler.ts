import { URI } from 'vscode-uri'
import { DefaultHttpRequester, HttpRequester, getETag } from '../../http/requesters'
import { ContentRequestMiddleware, ContentRequestMiddlewareDelegate } from '../contentRequestMiddleware'
import { ContentRequestResponse } from '../contentRequestResponse'

export class HttpHandler implements ContentRequestMiddleware {
    constructor(readonly httpContentDownloader: HttpRequester = new DefaultHttpRequester()) {}

    /**
     * Downloads the content of a HTTP uri.
     *
     * @param uri
     * @param eTag
     * @returns text content and eTag if it exists
     */
    async get(uri: URI, next: ContentRequestMiddlewareDelegate): Promise<ContentRequestResponse> {
        if (!uri.scheme.startsWith('http')) {
            // we only know how to handle http(s) requests. Go to the next handler.
            return next(uri)
        }

        const response = await this.httpContentDownloader.request(uri.toString(), {})
        const latestETag = getETag(response.headers)
        return { content: response.responseText, eTag: latestETag }
    }
}
