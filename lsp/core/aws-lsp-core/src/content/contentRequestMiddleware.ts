import { URI } from 'vscode-uri'
import { ContentRequestResponse } from './contentRequestResponse'

export type ContentRequestMiddlewareDelegate = {
    (uri: URI): Promise<ContentRequestResponse>
}

export interface ContentRequestMiddleware {
    get(uri: URI, next: ContentRequestMiddlewareDelegate): Promise<ContentRequestResponse>
}
