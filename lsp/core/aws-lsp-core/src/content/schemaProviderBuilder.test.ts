import * as chai from 'chai'
import { expect } from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { beforeEach, describe, it } from 'node:test'
import { URI } from 'vscode-uri'
import { ContentRequestMiddleware, ContentRequestMiddlewareDelegate } from './contentRequestMiddleware'
import { ContentRequestResponse } from './contentRequestResponse'
import { SchemaProviderBuilder } from './schemaProviderBuilder'

chai.use(chaiAsPromised)

describe('Test SchemaProviderBuilder', async () => {
    const sampleUri = 'file://sample/location'
    let sut: SchemaProviderBuilder

    beforeEach(async () => {
        sut = new SchemaProviderBuilder()
    })

    it('throws when no handler is added', async () => {
        const handler = sut.build()
        await expect(handler(sampleUri)).to.be.rejected
    })

    it('throws when unhandled', async () => {
        sut.addHandler(createDelegatingMiddleware())

        const handler = sut.build()
        await expect(handler(sampleUri)).to.be.rejected
    })

    it('builds one handler', async () => {
        sut.addHandler(createMiddlewareReturning('foo'))

        const handler = sut.build()
        const result = await handler(sampleUri)

        expect(result).to.equal('foo')
    })

    it('delegates to next handler', async () => {
        sut.addHandler(createDelegatingMiddleware())
        sut.addHandler(createMiddlewareReturning('foo'))

        const handler = sut.build()
        const result = await handler(sampleUri)

        expect(result).to.equal('foo')
    })

    it('stops delegating when a handler returns', async () => {
        sut.addHandler(createMiddlewareReturning('foo'))
        sut.addHandler(createMiddlewareReturning('bar'))

        const handler = sut.build()
        const result = await handler(sampleUri)

        expect(result).to.equal('foo')
    })

    function createMiddlewareReturning(contentResponse: string): ContentRequestMiddleware {
        return {
            get(uri: URI, next: ContentRequestMiddlewareDelegate): Promise<ContentRequestResponse> {
                return Promise.resolve({
                    content: contentResponse,
                })
            },
        }
    }

    function createDelegatingMiddleware(): ContentRequestMiddleware {
        return {
            get(uri: URI, next: ContentRequestMiddlewareDelegate): Promise<ContentRequestResponse> {
                return next(uri)
            },
        }
    }
})
