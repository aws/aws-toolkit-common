import {
    CompletionItem,
    CompletionList,
    Connection,
    Diagnostic,
    DiagnosticSeverity,
    Hover,
    HoverParams,
    Range,
    TextDocumentPositionParams,
} from 'vscode-languageserver'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { LanguageContext } from '../../../server/context'
import { BaseLanguageService } from '../../types'
import { cfn_guard_run_checks } from './cfn_guard_wasm'
import path = require('path')

// const SCHEMA_URL = 'https://d3rrggjwfhwld2.cloudfront.net/CodeBuild/buildspec/buildspec-standalone.schema.json'

export class Cc2Service extends BaseLanguageService {
    private _init: boolean
    // constructor(private readonly yaml: YamlLanguageService = new YamlLanguageService(SCHEMA_URL)) {
    constructor(readonly context: LanguageContext) {
        super()
        this._init = false
    }

    completion(
        document: TextDocument,
        textDocumentPositionParams: TextDocumentPositionParams
    ): Promise<CompletionItem[] | CompletionList> {
        // sample completion, just a bunch of a's
        const x: CompletionItem[] = []
        const ci: CompletionItem = {
            label: 'cc2 aaaaaa',
            insertText: 'aaaaa',
        }

        x.push(ci)
        return Promise.resolve(x)
    }

    async diagnostic(document: TextDocument, connection: Connection): Promise<Diagnostic[]> {
        this.context.lspConnection.console.info('Cc2 Diag')

        const diags: Diagnostic[] = []

        try {
            // run the wasm validator, then check for failure details
            const dataVal = document.getText()

            const ruleVal = `rule checkBucketNameStringValue when Resources.S3Bucket.Properties.BucketName is_string {
                Resources.S3Bucket.Properties.BucketName != /(?i)z/
            }`

            let resp = cfn_guard_run_checks(dataVal, ruleVal)

            const pos = dataVal.indexOf('BucketName')
            const eolPos = dataVal.indexOf('\n', pos)

            // const range = Range.create(0, 0, document.lineCount, 0)
            const range = Range.create(document.positionAt(pos), document.positionAt(eolPos))

            const source = 'cc2 and wasm'

            try {
                const json = JSON.parse(resp)
                // this.context.lspConnection.console.info(resp)
                const docStatus = json.container.FileCheck.status
                if (docStatus == 'PASS') {
                    const diag: Diagnostic = {
                        range,
                        severity: DiagnosticSeverity.Information,
                        source,
                        message: 'Doc is OK!',
                    }

                    // diags.push(diag)
                } else {
                    const diag: Diagnostic = {
                        range,
                        severity: DiagnosticSeverity.Warning,
                        source,
                        message: `Doc status: ${docStatus}`,
                    }

                    diags.push(diag)

                    function bee(child: any) {
                        if (child.container.RuleCheck.status != 'PASS') {
                            const diagN: Diagnostic = {
                                range,
                                severity: DiagnosticSeverity.Error,
                                source,
                                message: `${child.context}: ${child.container.RuleCheck.name}: ${child.container.RuleCheck.status}`,
                            }

                            diags.push(diagN)
                        }

                        for (const subchild of child.children) {
                            bee(subchild)
                        }
                    }

                    for (const child of json.children) {
                        bee(child)
                    }

                    const diag2: Diagnostic = {
                        range,
                        severity: DiagnosticSeverity.Error,
                        source,
                        message: resp,
                    }

                    diags.push(diag2)
                }
            } catch (err) {}
        } catch (err) {
            this.context.lspConnection.console.info(`Cc2 Diag error: ${err}`)
        }

        // todo : WASM it up here
        // return diags
        return Promise.resolve(diags)
        // return Promise.resolve(x)
    }

    hover(document: TextDocument, params: HoverParams): Promise<Hover | null> {
        return Promise.resolve(null)
    }
}
