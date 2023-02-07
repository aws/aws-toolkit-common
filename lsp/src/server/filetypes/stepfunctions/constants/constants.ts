/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT
 */

export const LANGUAGE_IDS = {
    ASL_YAML: 'asl-yaml',
    ASL_JSON: 'asl',
    YAML: 'yaml',
    JSON: 'json'
} as const

export const FILE_EXTENSIONS = {
    YAML: 'asl.yaml',
    JSON: 'asl'
} as const

export function isYAML(languageId: string) {
    return languageId === LANGUAGE_IDS.ASL_YAML || languageId === LANGUAGE_IDS.YAML
}

export function isJSON(languageId: string) {
    return languageId === LANGUAGE_IDS.ASL_JSON || languageId === LANGUAGE_IDS.JSON
}
