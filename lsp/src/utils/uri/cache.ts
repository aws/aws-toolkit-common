
import { createHash } from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { URI } from 'vscode-uri'
import { LanguageServerCacheDir } from '../configurationDirectory'
import { Time } from '../datetime'
import { HttpRequester, HttpRequesterI, HttpRequestHeaders, HttpResponse } from '../http/request'

/** Represents the `metadata` file structure */
interface UriCacheMetadata {
    [uri: string]: UriCacheMetadataEntry
}

/** Represents a single Uri entry in `metadata` */
interface UriCacheMetadataEntry {
    lastUpdated?: number
    contentFileName?: string
    eTag?: string
}

/**
 * Provides functionality to retrieve the content
 * of a URI. Content is cached locally for efficient
 * repeated reads.
 * 
 * Cache is considered stale after {@link thirtyMinutesInMillis}
 * and is refreshed.
 * 
 * The structure of the cache directory looks as follows: 
 * 
 * {@link cacheDirRoot}/
 * └── cachedUris/
 *     ├── metadata
 *     ├── d8e3b6aadda6a6e9e <- Hashed uri for unique name, holds the actual data
 *     ├── 6a6e9ec3c66bf70fb
 *     └── bd37ce0972ac0351f
 * 
 * `metadata` has information about all cached uris.
 * 
 * Every other file with a hashed name represents the
 * latest content of a specific uri.
 * 
 * `metadata` contains a json entry for each uri that
 * will have information about that uri, including the
 * hashed file name that contains the cached content.  
 */
export class UriCacheManager {
    private static readonly thirtyMinutesInMillis = 60 * 30 * 1000
    static readonly timeoutPeriodInMillis = UriCacheManager.thirtyMinutesInMillis

    private cachedUrisDirPath: string
    private cacheMetadataPath: string
    private time: Time

    constructor(
        cacheDirRoot: string = LanguageServerCacheDir.path,
        private readonly httpContentDownloader: HttpRequesterI = new HttpRequester(),
        time?: Time
    ) {
        // Setup uri cache directory
        this.cachedUrisDirPath =  path.join(cacheDirRoot, 'cachedUris')
        fs.mkdirSync(this.cachedUrisDirPath, { recursive: true })

        // Setup cache metadata file
        this.cacheMetadataPath = path.join(this.cachedUrisDirPath, 'metadata')
        if (!fs.existsSync(this.cacheMetadataPath)) {
            fs.writeFileSync(this.cacheMetadataPath, "{}")
        }
        const tt = new Date()
        this.time = time ?? new Time()
    }

    getContentFromString(uri: string): Promise<string> {
        const actualUri = URI.parse(uri)
        return this.getContent(actualUri)
    }

    async getContent(uri: URI): Promise<string> {
        if (!uri.scheme.startsWith('http')) {
            throw Error(`Non-http schemed URIs not supported: ${uri.toString()}`)
        }

        const uriAsString = uri.toString()
        const allMetadata: UriCacheMetadata = JSON.parse(fs.readFileSync(this.cacheMetadataPath, { encoding: 'utf-8' }))

        // Get cached data for current URI
        const cachedMetadataEntry: UriCacheMetadataEntry | undefined = allMetadata[uriAsString]
        const cachedContentFileName = cachedMetadataEntry?.contentFileName
        const cachedContent = this.getContentFileText(cachedContentFileName)
        const cachedETag: string | string[] | undefined = cachedMetadataEntry?.eTag
        const cachedLastUpdated = cachedMetadataEntry?.lastUpdated

        let headers: HttpRequestHeaders = {}

        if (cachedETag !== undefined && cachedContent !== undefined) {
            // We have valid cached content at this point
            if (!this.isCacheTimeout(cachedLastUpdated)) {
                // We have valid cached content that has not timed out yet.
                return cachedContent
            }
            // 'If-None-Match' Header induces 304 status if ETag value matches the remote's.
            // See: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag
            headers = { 'If-None-Match': cachedETag }
        }

        // Request uri data
        let response: HttpResponse
        try {
            response = await this.httpContentDownloader.request(uri.toString(), { headers })
        }
        catch (err) {
            if ((err as HttpResponse).status == 304 && cachedContent !== undefined) {
                // The current http request library throws an error on,
                // I'm assuming non 200 status codes, so we need to catch this
                // case. If we can disable the exception this try/catch can be removed.

                // Requested data matches our cache.
                this.updateLastUpdatedTime(allMetadata, uri)
                return cachedContent
            }
            throw err
        }

        // Collect required data from response
        const latestContent = response.responseText
        let latestETag = response.headers.etag
        if (Array.isArray(latestETag)) {
            latestETag = undefined
        }
        const contentFileName = this.hashUri(uri)
        const metadataEntry: UriCacheMetadataEntry = {
            contentFileName: contentFileName,
            eTag: latestETag,
            lastUpdated: this.time.inMilliseconds()
        }

        // Update URI cache with response data
        allMetadata[uriAsString] = metadataEntry
        this.writeMetadata(allMetadata)
        this.writeContentFileText(contentFileName, latestContent)

        return latestContent
    }

    getETag(uri: URI): string | undefined {
        const allMetadata: UriCacheMetadata = JSON.parse(fs.readFileSync(this.cacheMetadataPath, { encoding: 'utf-8' }))
        return allMetadata[uri.toString()]?.eTag
    }

    /** Sets the last updated time to the current time in the `metadata` file.  */
    private updateLastUpdatedTime(uriCache: UriCacheMetadata, uri: URI): void {
        uriCache[uri.toString()].lastUpdated = this.time.inMilliseconds()
        this.writeMetadata(uriCache)
    }

    /** Checks if the cache has timed out using the last updated time. */
    private isCacheTimeout(lastUpdated?: number): boolean {
        if (lastUpdated === undefined) {
            return true
        }

        const diff = this.time.inMilliseconds() - lastUpdated
        return (diff) > UriCacheManager.thirtyMinutesInMillis
    }

    /** Updates the 'metadata' file with the given input */
    private writeMetadata(uriCache: UriCacheMetadata): void {
        fs.writeFileSync(this.cacheMetadataPath, JSON.stringify(uriCache))
    }

    /** Gets the content of a uri from the cache */
    private getContentFileText(contentFileName?: string): string | undefined {
        if (contentFileName === undefined) {
            return
        }

        const absolutePath = path.join(this.cachedUrisDirPath, contentFileName)
        if (!fs.existsSync(absolutePath)) {
            return
        }

        return fs.readFileSync(absolutePath, { encoding: "utf8" })
    }

    private writeContentFileText(contentFileName: string, text: string): void {
        const absolutePath = path.join(this.cachedUrisDirPath, contentFileName)
        fs.writeFileSync(absolutePath, text)
        return
    }

    private hashUri(uri: URI): string {
        return createHash('sha256').update(uri.toString()).digest('hex')
    }
}
