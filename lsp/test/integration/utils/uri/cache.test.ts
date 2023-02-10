import { assert } from 'chai'
import { createTempDirectorySync, ITempDirectorySync } from 'create-temp-directory'
import { SinonSpiedInstance, SinonStubbedInstance, spy, stub } from 'sinon'
import { URI } from 'vscode-uri'
import { Time } from '../../../../src/utils/datetime'
import { HttpRequester } from '../../../../src/utils/http/request'
import { UriCacheManager } from '../../../../src/utils/uri/cache'

describe(`Test ${UriCacheManager.name}`, async () => {
    describe(`Test getContent()`, async () => {
        const realHttpUri = URI.parse("https://json.schemastore.org/mocharc.json")
        let actualUriContent: string
        let tmpDir: ITempDirectorySync
        let httpRequesterSpy: SinonSpiedInstance<HttpRequester>
        let instance: UriCacheManager
        let timeStub: SinonStubbedInstance<Time>


        beforeEach(async () => {
            tmpDir = createTempDirectorySync()

            const httpRequester = new HttpRequester()
            actualUriContent = (await httpRequester.request(realHttpUri.toString())).responseText
            httpRequesterSpy = spy(httpRequester)

            timeStub = stub(new Time())
            timeStub.inMilliseconds.callThrough()

            instance = new UriCacheManager(tmpDir.path, httpRequesterSpy, timeStub)
        })

        afterEach(async () => {
            tmpDir.remove()
        })

        it('gets uri content from server on initial request.', async () => {
            const result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, actualUriContent)
            assert(httpRequesterSpy.request.calledOnce)
        })

        it('gets uri content from cache on second request.', async () => {
            // First request will download
            let result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, actualUriContent)
            assert(httpRequesterSpy.request.calledOnce)

            // Second request returns same content without download
            result = await instance.getContent(realHttpUri)
            assert(httpRequesterSpy.request.calledOnce)
            assert.strictEqual(result, actualUriContent)
        })

        it('sends request with etag if cache is timed out.', async () => {
            // First request will download
            let result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, actualUriContent)

            // Stub the timer to be timed out
            timeStub.inMilliseconds.resetBehavior()
            const millisecondAfterTimeoutPeriod = new Time().inMilliseconds() + UriCacheManager.timeoutPeriodInMillis + 1
            timeStub.inMilliseconds.returns(millisecondAfterTimeoutPeriod)

            // Second request will download, but with eTag
            result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, actualUriContent)
            // Assert second request uses eTag
            assert(httpRequesterSpy.request.calledTwice)
            assert.deepStrictEqual(
                httpRequesterSpy.request.secondCall.args[1],
                { headers: { 'If-None-Match': instance.getETag(realHttpUri) }}
            )
        })
    })
})