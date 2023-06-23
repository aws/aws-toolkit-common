import {
    CodeWhispererServer,
    CodeWhispererServerProps,
    CodeWhispererServiceProps,
    createCodeWhispererService,
} from '@lsp-placeholder/aws-lsp-codewhisperer'
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node'

const connection = createConnection(ProposedFeatures.all)

const serviceProps: CodeWhispererServiceProps = {
    displayName: CodeWhispererServer.serverId,
}

const cloudformationService = createCodeWhispererService(serviceProps)

const props: CodeWhispererServerProps = {
    connection,
    codeWhispererService: cloudformationService,
}

export const server = new CodeWhispererServer(props)
