import { assert } from 'chai'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { BuildspecServiceStrategy } from '../strategy'

function textDocument(uri: string): TextDocument {
    return {uri} as TextDocument
}

describe('BuildspecServiceStrategy', () => {
    const instance = new BuildspecServiceStrategy()
    describe('isMatch()', () => {
        it('returns true on matching file names', async () => {
            assert.isTrue(await instance.isMatch(textDocument('buildspec.yaml')))
            assert.isTrue(await instance.isMatch(textDocument('build.yaml')))
            assert.isTrue(await instance.isMatch(textDocument('buildspec.yml')))
            assert.isTrue(await instance.isMatch(textDocument('buildspec.yml')))
            assert.isTrue(await instance.isMatch(textDocument('bla://bla.bla/buildspec.yml')))
        })

        it('returns false on non-matching file names', async () => {
            assert.isFalse(await instance.isMatch(textDocument('buildspec.YOOML')))
            assert.isFalse(await instance.isMatch(textDocument('build.txt')))
            assert.isFalse(await instance.isMatch(textDocument('bla://bla.bla/file.txt')))
        })
    })

    describe('getLanguageService()', () => {
        it('returns expected instance', () => {
            // TODO: In BuildspecService we create a YAMLLanguageService instance
            // but it cannot be created properly due to the issue that this fixes:
            // https://github.com/redhat-developer/yaml-language-server/pull/831#
            // There are a lot of garbage instances we must create to get the service
            // and those instances are not easy to create (in this case in the testing environment).
            // Once the above PR is merged, we can properly complete this test.

            // assert.isTrue(instance.getLanguageService() instanceof BuildspecService)
        })
    })
})