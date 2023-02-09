/**
 * This script converts an ssmDocumentSchema object into a json object.
 * The resulting json object will be copied to ssm/schema/ssmSchema.json on execution of this script
 * The resulting json file will then be copied to the output file by the copyFiles script so that the schema
 * can be referenced internally by the language servers
 */
import * as fs from 'fs-extra'
import { resolve } from 'path'
import { ssmDocumentSchema } from '../schema/ssmDocumentSchema'

const documentJSONSchema = JSON.stringify(ssmDocumentSchema)
const location = resolve(__dirname, '../schema/ssmSchema.json')
fs.writeFileSync(location, documentJSONSchema, 'utf-8')
