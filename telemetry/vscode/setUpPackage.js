/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

fs = require('fs-extra')

fs.copySync('../data/telemetrydefinitions.json', './out/telemetrydefinitions.json')
