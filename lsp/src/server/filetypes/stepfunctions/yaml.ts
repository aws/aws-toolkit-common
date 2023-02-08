import { resolve } from 'path'
import {
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    Diagnostic,
    HoverParams,
    TextDocumentPositionParams,
    TextEdit,
    URI
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { YAMLDocument } from 'yaml-language-server/out/server/src/languageservice/parser/yaml-documents'
import { parse } from 'yaml-language-server/out/server/src/languageservice/parser/yamlParser07'
import { matchOffsetToDocument } from 'yaml-language-server/out/server/src/languageservice/utils/arrUtils'
import { BackendService, LanguageService } from '../../service'
import doCompleteAsl from './completion/completeAsl'
import { isYAML } from './constants/constants'
import { ASLOptions } from './utils/astUtilityFunctions'
import { getASLDiagnostics } from './validation/diagnostics'
import { convertJsonSnippetToYaml, getOffsetData, processYamlDocForCompletion } from './yaml/yamlUtils'

const CATCH_INSERT = 'Catch:\n\t- '
const RETRY_INSERT = 'Retry:\n\t- '

export function service(uri: URI): LanguageService {
    BackendService.getInstance().yaml.configure({
        hover: true,
        completion: true,
        validate: true,
        customTags: [],
        schemas: [
            {
                fileMatch: [uri],
                // This is a bit weird because the schema is technically contained internally
                uri: `file://${resolve(__dirname, './json-schema/bundled.json')}`
            }
        ]
    })

    return {
        completion: async (document: TextDocument, textDocumentPositionParams: TextDocumentPositionParams) => {
            const {
                modifiedDocText,
                tempPositionForCompletions,
                startPositionForInsertion,
                endPositionForInsertion,
                shouldPrependSpace
            } = processYamlDocForCompletion(document, textDocumentPositionParams.position)

            const offsetIntoOriginalDocument = document.offsetAt(textDocumentPositionParams.position)
            const offsetIntoProcessedDocument = document.offsetAt(tempPositionForCompletions)

            const processedYamlDoc: YAMLDocument = parse(modifiedDocText)
            const currentDoc = matchOffsetToDocument(offsetIntoProcessedDocument, processedYamlDoc)

            if (!currentDoc) {
                return { items: [], isIncomplete: false }
            }

            const yamlCompletions = await BackendService.getInstance().yaml.doComplete(
                document,
                textDocumentPositionParams.position,
                false
            )

            // yaml-language-server does not output correct completions for retry/catch
            // we need to overwrite the text
            function updateCompletionText(item: CompletionItem, text: string) {
                item.insertText = text

                if (item.textEdit) {
                    item.textEdit.newText = text
                }
            }

            yamlCompletions.items.forEach((item: CompletionItem) => {
                if (item.label === 'Catch') {
                    updateCompletionText(item, CATCH_INSERT)
                } else if (item.label === 'Retry') {
                    updateCompletionText(item, RETRY_INSERT)
                }
            })

            const {
                isDirectChildOfStates,
                isWithinCatchRetryState,
                hasCatchPropSibling,
                hasRetryPropSibling
            } = getOffsetData(document, offsetIntoOriginalDocument)

            const aslOptions: ASLOptions = {
                ignoreColonOffset: true,
                shouldShowStateSnippets: isDirectChildOfStates,
                shouldShowErrorSnippets: {
                    retry: isWithinCatchRetryState && !hasRetryPropSibling,
                    catch: isWithinCatchRetryState && !hasCatchPropSibling
                }
            }

            const aslCompletions: CompletionList = doCompleteAsl(
                document,
                tempPositionForCompletions,
                currentDoc,
                yamlCompletions,
                aslOptions
            )

            const modifiedAslCompletionItems: CompletionItem[] = aslCompletions.items.map(completionItem => {
                const completionItemCopy = { ...completionItem } // Copy completion to new object to avoid overwriting any snippets

                if (
                    completionItemCopy.insertText &&
                    completionItemCopy.kind === CompletionItemKind.Snippet &&
                    isYAML(document.languageId)
                ) {
                    completionItemCopy.insertText = convertJsonSnippetToYaml(completionItemCopy.insertText)
                } else {
                    const currentTextEdit = completionItemCopy.textEdit as TextEdit

                    if (currentTextEdit) {
                        if (shouldPrependSpace) {
                            if (currentTextEdit.newText && currentTextEdit.newText.charAt(0) !== ' ') {
                                currentTextEdit.newText = ' ' + currentTextEdit.newText
                            }
                            if (completionItemCopy.insertText && completionItemCopy.insertText.charAt(0) !== ' ') {
                                completionItemCopy.insertText = ' ' + completionItemCopy.insertText
                            }
                        }

                        currentTextEdit.range.start = startPositionForInsertion
                        currentTextEdit.range.end = endPositionForInsertion

                        // Completions that include both a key and a value should replace everything right of the cursor.
                        if (completionItemCopy.kind === CompletionItemKind.Property) {
                            currentTextEdit.range.end = {
                                line: endPositionForInsertion.line,
                                character: document.getText().length
                            }
                        }
                    }
                }

                return completionItemCopy
            })

            const modifiedAslCompletions: CompletionList = {
                isIncomplete: aslCompletions.isIncomplete,
                items: modifiedAslCompletionItems
            }

            return Promise.resolve(modifiedAslCompletions)
        },
        diagnostic: async (document: TextDocument) => {
            const yamlDocument: YAMLDocument = parse(document.getText())
            const validationResult: Diagnostic[] = []

            validationResult.push(...(await BackendService.getInstance().yaml.doValidation(document, false)))
            for (const currentYAMLDoc of yamlDocument.documents) {
                validationResult.push(
                    ...getASLDiagnostics(document, currentYAMLDoc, {
                        ignoreColonOffset: true
                    })
                )
            }

            return validationResult
        },
        hover: (document: TextDocument, params: HoverParams) => {
            return BackendService.getInstance().yaml.doHover(document, params.position)
        }
    }
}
