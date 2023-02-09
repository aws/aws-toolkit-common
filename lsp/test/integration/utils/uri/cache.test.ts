import { assert } from 'chai'
import { createTempDirectorySync, ITempDirectorySync } from 'create-temp-directory'
import { SinonStubbedInstance, stub } from 'sinon'
import { } from 'ts-sinon'
import { URI } from 'vscode-uri'
import { Time } from '../../../../src/utils/datetime'
import { HttpRequester } from '../../../../src/utils/http/request'
import { UriCacheManager } from '../../../../src/utils/uri/cache'
import { HttpUriContentDownloader } from '../../../../src/utils/uri/http'

describe(`Test ${UriCacheManager.name}`, async () => {
    describe(`Test getContent()`, async () => {
        const realHttpUri = URI.parse("https://json.schemastore.org/mocharc.json")
        let actualUriContent: string
        let tmpDir: ITempDirectorySync
        let stubbedDownloader: SinonStubbedInstance<HttpUriContentDownloader>
        let instance: UriCacheManager
        let timeStub: SinonStubbedInstance<Time>


        beforeEach(async () => {
            actualUriContent = (await new HttpRequester().request(realHttpUri.toString())).responseText

            tmpDir = createTempDirectorySync()

            stubbedDownloader = stub(new HttpUriContentDownloader())
            stubbedDownloader.sendRequest.callThrough()

            timeStub = stub(new Time())
            timeStub.inMilliseconds.callThrough()

            instance = new UriCacheManager(tmpDir.path, stubbedDownloader, timeStub)
        })

        afterEach(async () => {
            tmpDir.remove()
        })

        it('gets uri content from server on initial request.', async () => {
            const result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, actualUriContent)
        })

        it('gets uri content from cache on second request.', async () => {
            // First request will download
            let result = await instance.getContent(realHttpUri)
            assert.strictEqual(result, actualUriContent)

            // Set error to be thrown on download attempt
            stubbedDownloader.sendRequest.throws()

            // Second request returns same content without download
            result = await instance.getContent(realHttpUri)
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
            assert.strictEqual(stubbedDownloader.sendRequest.callCount, 2)
            // Assert second requests uses eTag
            const sendRequestSecondArgs = stubbedDownloader.sendRequest.secondCall.args
            const actualHeaders = sendRequestSecondArgs[1]
            assert.deepStrictEqual(actualHeaders, { 'If-None-Match': instance.getETag(realHttpUri) })
        })
    })
})