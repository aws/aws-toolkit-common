/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

fs = require('fs-extra')

fs.copySync('../telemetryDefinitions.json', './lib/telemetryDefinitions.json')
fs.copySync('../telemetrySchema.json', './lib/telemetrySchema.json')
