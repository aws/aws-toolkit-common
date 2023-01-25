import { assert } from 'chai'
import { createStubInstance, SinonStubbedInstance } from 'sinon'
import { stubInterface } from 'ts-sinon'
import { URI } from 'vscode-uri'
import { HttpRequester, HttpRequestHeaders, HttpResponse } from '../../../../../src/server/utils/http/request'
import { HttpUriContentDownloader } from '../../../../../src/server/utils/uri/download'

describe('Test class HttpUriContentDownloader', async () => {
    describe('Test sendRequest()', async () => {
        const uri = URI.parse('https://something.com/file.txt')
        let headers: HttpRequestHeaders
        let httpRequester: SinonStubbedInstance<HttpRequester>
        let instance: HttpUriContentDownloader

        beforeEach(async () => {
            headers = stubInterface()
            httpRequester = createStubInstance(HttpRequester)
            instance = new HttpUriContentDownloader(httpRequester)
        })

        it('sends request as expected', async () => {
            const requestReturnVal: HttpResponse = stubInterface()
            httpRequester.request.resolves(requestReturnVal)

            const response = await instance.sendRequest(uri, headers)

            assert.deepStrictEqual(response, requestReturnVal)
            assert.deepStrictEqual(httpRequester.request.args, [[uri.toString(), { headers }]])
        })
    })
})