# Telemetry Format

Telemetry definitions are made up of json files. Multiple files can exist and are merged together at build time. After they are merged, one file in the target language is generated that can call the platform specific telemetry client. Each platform's generator has platform specific ways to generate a final telemetry file, see each platform's readme for more details.

## Format

The format is JSON object with two fields:

### types

*types* is an optional field that contains 0 or more entries

```json
"types": [
   {
        // comments are allowed
        "name": string,
        "description": string,
        (optional - default is "string") "type": one of "int", "double", "string", "boolean"
        (optional - default is empty = anything) "allowedValues": [ ... string array]
    },
    ...
```

### metrics

*metrics *is a required field that contains 1 or more entries

```json
"metrics": [
    {
        "name": string,
        "description": string,
        (optional - default is "none") "unit": one of "Milliseconds", "Bytes","Percent","Count","None"
        (optional - default is empty) "metadata": [
            "type": string (the string references a previously defined type)
            (optional - default true)"required": boolean
        ]
    },
]
```

These are then used to generate functions that take arguments pertaining to metrics

### global arguments

*Additionally* two additional global arguments that can be appended to any call

```json
// The time that the event took place
createTime?: Date
// Value based on unit and call type
value?: number
```
