/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

fs = require('fs-extra')

fs.copySync('../telemetryDefinitions.json', './out/telemetryDefinitions.json')
fs.copySync('../telemetrySchema.json', './out/telemetrySchema.json')
