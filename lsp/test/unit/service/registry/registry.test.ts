import { assert } from 'chai'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageServiceRegistry } from '../../../../src/service/registry/registry'
import { LanguageServiceStrategy } from '../../../../src/service/registry/types'
import { BaseLanguageService, LanguageService } from '../../../../src/service/types'

/**
 * Language Service implementation for testing.
 * 
 * Requires an ID that can uniquely identify the instance.
 */
class FakeLanguageService extends BaseLanguageService {
    constructor (readonly id: string) {
        super()
    }
}

/**
 * Helper function to create a {@link LanguageServiceStrategy}
 */
function createStrategy(isMatchFunc: (td: TextDocument) => boolean, languageService: LanguageService): LanguageServiceStrategy {
    const languageStrategy: LanguageServiceStrategy = {
        isMatch: async(textDocument) => isMatchFunc(textDocument),
        getLanguageService: () => languageService,
    }
    return languageStrategy
}

describe('LanguageServiceRegistry', () => {
    let languageServiceRegistry: LanguageServiceRegistry

    beforeEach(() => {
        languageServiceRegistry = new LanguageServiceRegistry()
    })

    describe('getLanguageService()', () => {
        it('resolves a service when single strategy and match found', async () => {
            const languageService = new FakeLanguageService('0')
            const extName = 'MyExt'
            const languageStrategy = createStrategy((textDocument) => textDocument.uri.endsWith(`.${extName}`), languageService)

            languageServiceRegistry.addStrategy(languageStrategy)
            const result = await languageServiceRegistry.getLanguageService({uri: `file://my.uri/something.${extName}`} as TextDocument)
    
            assert.strictEqual(result, languageService)
        })
    
        it('resolves a service when multiple strategies and match found', async () => {
            // The strategies/services that wont match
            const languageStrategy0 = createStrategy((textDocument) => textDocument.uri.endsWith('.MyExt'), new FakeLanguageService('0'))
            languageServiceRegistry.addStrategy(languageStrategy0)

            const languageStrategy1 = createStrategy((textDocument) => textDocument.uri.endsWith('.MyOtherExt'), new FakeLanguageService('1'))
            languageServiceRegistry.addStrategy(languageStrategy1)
    
            // The strategy/service that will match
            const languageService2 = new FakeLanguageService('2')
            const extName = 'MyOtherOtherExt'
            const languageStrategy2 = createStrategy((textDocument) => textDocument.uri.endsWith(`.${extName}`), languageService2)
            languageServiceRegistry.addStrategy(languageStrategy2)
    
            const result = await languageServiceRegistry.getLanguageService({uri: `file://my.uri/something.${extName}`} as TextDocument)
    
            assert.strictEqual(result, languageService2)
        })

        it('resolves undefined when no strategies added', async () => {
            const result = await languageServiceRegistry.getLanguageService({uri: `file://my.uri/something.txt`} as TextDocument)
            assert.strictEqual(result, undefined)
        })
    
        it('resolves undefined when multiple strategies but no match found', async () => {
            const languageStrategy0 = createStrategy((textDocument) => false, {} as LanguageService)
            const languageStrategy1 = createStrategy((textDocument) => false, {} as LanguageService)
    
            languageServiceRegistry.addStrategy(languageStrategy0)
            languageServiceRegistry.addStrategy(languageStrategy1)
    
            const result = await languageServiceRegistry.getLanguageService({uri: `file://my.uri/something.txt`} as TextDocument)
    
            assert.strictEqual(result, undefined)
        })
    })

    
})