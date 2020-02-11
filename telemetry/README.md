# Telemetry
`telemetry` contains code generators and definitions files to generate telemetry calls for the various
AWS Toolkits.

## Adding Telemetry

### What to edit

Each AWS Toolkit has a file that is useful for prototyping telemetry. They can be found in their repos at the path:

- VS Code - `src/shared/telemetry/vscodeTelemetry.json`
- JetBrains - TBD

Make changes in these files, then from the AWS Toolkit repo root run:

- VS Code - `npm run generateTelemetry`
- JetBrains - `./gradlew generateTelemetry`

To update the generated output. When you are satisfied with generated telemetry, move
the definitions you just added to to the appropriate file in `definitions` in this repo.

### How to edit

The easiest way to edit telemetry is to copy existing telemetry and change the values. For example,
to add a piece of metadata that takes a limited number of strings, take an existing type:

```json
    {
        "name": "schemaLanguage",
        "type": "string",
        "allowedValues": ["Java8", "Python36", "TypeScript3"],
        "description": "Languages targeted by the schemas service"
    }
```

and change `name`, `description`, and the values in `allowedValues`

```json
    {
        "name": "veryImportantInformation",
        "type": "string",
        "allowedValues": ["yes", "no", "maybe"],
        "description": "This description is generated into doc comments so make it count"
    }
```

### Editing in IDE

The telemety format comes with a json schema document [here](telemetrySchema.json) that can ber loaded
into the IDE while editing the documents. This will give you feedback on edits as you edit.

- [VS Code Instructions](https://code.visualstudio.com/docs/languages/json#_mapping-to-a-schema-in-the-workspace)
- [JetBrains Instructions](https://www.jetbrains.com/help/idea/json.html#ws_json_schema_add_custom)

### Format Specification

See the [telemetry format document](telemetryformat.md) for complete format specification, or the 
[json schema that is used to validate at generate time](telemetrySchema.json)

## Consuming Generators

For specifics on how to consume the generators, see each IDE specific doc:

* [vscode](vscode/README.md)
* [jetbrains](jetbrains/README.md)
