import { URI } from 'vscode-uri'
import { HttpRequestHeaders, HttpRequester, HttpResponse } from '../http/request'


export class HttpUriContentDownloader {

    private requester: HttpRequester

    constructor(requester: HttpRequester = new HttpRequester()) {
        this.requester = requester

    }

    async sendRequest(uri: URI, headers?: HttpRequestHeaders): Promise<HttpResponse> {
        return this.requester.request(uri.toString(), { headers })
    }
}