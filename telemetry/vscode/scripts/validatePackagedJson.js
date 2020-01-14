/*!
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

Ajv = require('ajv')
fs = require('fs-extra')
path = require('path')

const telemetryDefinitions = fs.readFileSync(path.join(__dirname, '../out/telemetryDefinitions.json'), 'utf8')
const schemaInput = fs.readFileSync(path.join(__dirname, '../out/telemetrySchema.json'), 'utf8')
const schema = JSON.parse(schemaInput)
const jsonValidator = new Ajv().compile(schema)
const input = JSON.parse(telemetryDefinitions)
const valid = jsonValidator(input)
if(!valid) {
    console.error("validating schema failed!")
    console.error(jsonValidator.errors)
    throw undefined
}