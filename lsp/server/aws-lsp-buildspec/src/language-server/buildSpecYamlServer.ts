import { YamlSchemaServer, YamlSchemaServerProps } from '@lsp-placeholder/aws-lsp-yaml-common'
import { jsonSchemaUrl } from './urls'

export type BuildspecYamlServerProps = Omit<YamlSchemaServerProps, 'defaultSchemaUri'>

/**
 * This is a demonstration language server that handles YAML files according to the
 * CodeBuild BuildSpec JSON Schema.
 */
export class BuildspecYamlServer extends YamlSchemaServer {
    constructor(props: BuildspecYamlServerProps) {
        super({
            defaultSchemaUri: jsonSchemaUrl,
            ...props,
        })
    }
}
