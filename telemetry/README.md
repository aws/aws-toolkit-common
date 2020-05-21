# Telemetry

`telemetry` contains code generators and definitions files to generate telemetry calls for the various
AWS Toolkits.

## Adding Telemetry

### Where to Edit

#### VS Code

For prototyping telemetry, modify the `src/shared/telemetry/vscodeTelemetry.json` inside the toolkit repository.

Make changes in that file, then from the AWS Toolkit repo root run:

`npm run generateTelemetry`

To update the generated output. When you are satisfied with generated telemetry, move
the definitions you just added to the appropriate file in `definitions` in this repo.

#### JetBrains

By using Gradle composite builds, we can prototype telemetry for the JetBrains toolkit directly in this repository.

Make changes to the appropriate file in `definitions` in this repository, then from the toolkit directory run:

`./gradlew generateTelemetry --include-build <path/to/aws-toolkit-common>/telemetry/jetbrains`

Your changes should then be reflected in the generated output.

### How to Edit

The easiest way to edit telemetry is to copy existing telemetry and change the values. For example,
to add a piece of metadata that is best represented by a string based enum, take an existing type:

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

Then rerun the generator. This example will generate a new type that can be imported or used in telemetry calls.

### Editing in IDE

The telemetry format comes with a json schema document [here](telemetrySchema.json) that can be loaded
into the IDE while editing the documents. This will give you feedback as you edit.

-   [VS Code Instructions](https://code.visualstudio.com/docs/languages/json#_mapping-to-a-schema-in-the-workspace)
-   [JetBrains Instructions](https://www.jetbrains.com/help/idea/json.html#ws_json_schema_add_custom)

### Format Specification

See the [telemetry format document](telemetryformat.md) for complete format specification, or the
[json schema](telemetrySchema.json)

## Consuming Generators

For specifics on how to consume the generators, see each IDE specific doc:

-   [vscode](vscode/README.md)
-   [jetbrains](jetbrains/README.md)
-   [C#](csharp/README.md)
