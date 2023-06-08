/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// This script validates the packaged JSON file with the packaged schema to make sure it is valid

import { readFileSync } from 'fs-extra'
import { validateInput } from '../src/parser'
;['./lib/commonDefinitions.json', './lib/vscodeDefinitions.json'].forEach(item =>
    validateInput(readFileSync(item, 'utf-8'), item)
)
