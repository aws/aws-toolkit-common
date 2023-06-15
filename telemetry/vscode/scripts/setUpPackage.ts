/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// Copy shared files into lib to be packaged

import { copySync } from 'fs-extra'

copySync('../definitions/commonDefinitions.json', './lib/commonDefinitions.json')
copySync('../definitions/vscodeDefinitions.json', './lib/vscodeDefinitions.json')
copySync('../telemetrySchema.json', './lib/telemetrySchema.json')
