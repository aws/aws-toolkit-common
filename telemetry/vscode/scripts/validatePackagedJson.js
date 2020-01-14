/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// This script validates the packaged JSON file with the packaged schema to make sure it is valid

Ajv = require('ajv')
fs = require('fs-extra')
path = require('path')

const telemetryDefinitions = fs.readFileSync(path.join(__dirname, '../lib/telemetryDefinitions.json'), 'utf8')
const schemaInput = fs.readFileSync(path.join(__dirname, '../lib/telemetrySchema.json'), 'utf8')
const schema = JSON.parse(schemaInput)
const jsonValidator = new Ajv().compile(schema)
const input = JSON.parse(telemetryDefinitions)
const valid = jsonValidator(input)
if(!valid) {
    console.error("validating schema failed!")
    console.error(jsonValidator.errors)
    throw undefined
}