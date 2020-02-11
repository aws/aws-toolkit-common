# Telemetry Format

Telemetry definitions are made up of json files that live in `definitions`. Files are merged together at build time. They output one file in the target language that can call the platform specific telemetry client. Each platform's generator has platform specific tweaks in 
the to generate a final telemetry file, see each platform's readme for more details.

## Format

The format is JSON object with two fields:

### Types

_types_ is an array that holds telemetry metadata types. This is the information posted to the telemetry service like
`isDebug` or `runtime`.  Entries can be referenced from other files. The field is optional.

```
"types": [
   {
        "name": string,
        "description": string,
        (optional - default is "string") "type": one of "int", "double", "string", "boolean"
        (optional - default is empty = anything) "allowedValues": [ ... string array]
    },
    ...
```

**Note: typename MUST be camelCase**

### Metrics

*metrics* is an array that contains the actual metrics posted to the service. `name` defines the metric name what is
posted to the service. `name` must be in the format`namespace_camelCaseName` (e.g. `s3_uploadObject`). The field is optional.

```
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

These are then used to generate functions that take arguments pertaining to metrics. For a concrete example:

### Example

#### Input
```json
"types": [
    {
        "name": "result",
        "allowedValues": ["Succeeded", "Failed", "Cancelled"],
        "description": "The result of the operation"
    },
        {
            "name": "runtime",
            "type": "string",
            "allowedValues": [
                "dotnetcore2.1",
                ...
                "python2.7"
            ],
            "description": "The lambda runtime"
        },
    ...
],
metrics: [
    {
        "name": "lambda_invokeRemote",
        "description": "Called when invoking lambdas remotely",
        "metadata": [{ "type": "runtime" }, { "type": "result" }]
    },
    ...
]
```
#### Output

```typescript
interface LambdaRemoteinvoke {
    // What lambda runtime was used in the operation
    runtime: runtime
    // The result of the operation
    result: result
    // The time that the event took place,
    createTime?: Date
    // Value based on unit and call type,
    value?: number
}

/**
 * called when invoking lambdas remotely
 * @param args See the LambdaRemoteinvoke interface
 * @returns Nothing
 */
export function recordLambdaRemoteinvoke(args: LambdaRemoteinvoke) {
    ext.telemetry.record({
        createTime: args?.createTime ?? new Date(),
        data: [
            {
                MetricName: 'lambda_invokeRemote',
                Value: args?.value ?? 1,
                Unit: 'None',
                Metadata: [
                    { Key: 'runtime', Value: args.runtime?.toString() ?? '' },
                    { Key: 'result', Value: args.result?.toString() ?? '' }
                ]
            }
        ]
    })
}
```

### Global Arguments

_Additionally_ two additional global arguments that can be appended to any call. 

```
// The time that the event took place
createTime?: Date
// Value based on unit and call type
value?: number
```

If not specified `createTime` defaults to UTC now, `value` defaults to `1.0`.
