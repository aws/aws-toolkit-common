/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// Copy shared files into lib to be packaged

import { copySync } from 'fs-extra'

copySync('../telemetryDefinitions.json', './lib/telemetryDefinitions.json')
copySync('../telemetrySchema.json', './lib/telemetrySchema.json')
copySync('vscodeTelemetryDefinitions.json', './lib/vscodeTelemetryDefinitions.json')
