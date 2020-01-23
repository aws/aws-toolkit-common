/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// This script validates the packaged JSON file with the packaged schema to make sure it is valid

import { validateInput } from '../src/parser'
import * as path from 'path'

[path.join(__dirname, '../lib/telemetryDefinitions.json'),
path.join(__dirname, '../lib/vscodeTelemetryDefinitions.json')].forEach((item) => validateInput(item))
