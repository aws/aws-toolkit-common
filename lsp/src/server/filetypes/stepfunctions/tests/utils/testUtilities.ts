/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

import { JSONDocument } from 'vscode-json-languageservice'
import { TextDocument } from 'vscode-languageserver-textdocument'
import { forceServiceConnection } from '../../../../../../test/utils/service'
import { BackendService } from '../../../../service'
import { FILE_EXTENSIONS, LANGUAGE_IDS } from '../../constants/constants'

/**
 * The yaml-language-server caches contents for a given uri, only updating when the content version
 * updates (when running as a language server this is done automatically). There isn't a transparent
 * way to do this when using it as a "service" so every time we attempt to validate we increase
 * the version by one
 */
export function* textDocumentVersionGenerator(): Generator<number> {
    let version = 0
    while (true) {
        version += 1
        yield version
    }
}

export function toDocument(
    text: string,
    isYaml?: boolean,
    version = 0
): { textDoc: TextDocument; jsonDoc: JSONDocument } {
    const textDoc = TextDocument.create(
        `foo://bar/file.${isYaml ? FILE_EXTENSIONS.YAML : FILE_EXTENSIONS.JSON}`,
        isYaml ? LANGUAGE_IDS.YAML : LANGUAGE_IDS.JSON,
        version,
        text
    )

    forceServiceConnection()
    const jsonDoc = BackendService.getInstance().json.parseJSONDocument(textDoc) as JSONDocument
    return { textDoc, jsonDoc }
}
