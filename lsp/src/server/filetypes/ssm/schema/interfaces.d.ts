/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Definition for snippets that can be specified within JSON schema for VSCode.
 * @see {@link https://code.visualstudio.com/docs/languages/json#_define-snippets-in-json-schemas}
 */
export interface SnippetDefinition {
    label?: string;
    description?: string;
    markdownDescription?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any;
    bodyText?: string;
}
