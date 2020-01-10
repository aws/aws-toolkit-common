# Telemetry Format

Telemetry definitions are made up of json files. Multiple files can exist and are merged together at build time. After they are merged, one file in the target language is generated that can call the platform specific telemetry client. Each platform's generator has platform specific ways to generate a final telemetry file, see each platform's readme for more details.

## Format

The format is JSON object with two fields:

### Types

_types_ is an optional field that contains 0 or more entries

```
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

**Note: typename MUST be camelCase**

### Metrics

*metrics* is a required field that contains 1 or more entries

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

These are then used to generate functions that take arguments pertaining to metrics. An example of one of these generated functions is:

```typescript
interface LambdaRemoteinvoke {
    // What lambda runtime was used in the operation
    lambdaruntime?: lambdaruntime
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
                MetricName: 'lambda_remoteinvoke',
                Value: args?.value ?? 1,
                Unit: 'None',
                Metadata: [
                    { Key: 'lambdaruntime', Value: args.lambdaruntime?.toString() ?? '' },
                    { Key: 'result', Value: args.result?.toString() ?? '' }
                ]
            }
        ]
    })
}
```

### Global Arguments

_Additionally_ two additional global arguments that can be appended to any call

```
// The time that the event took place
createTime?: Date
// Value based on unit and call type
value?: number
```
