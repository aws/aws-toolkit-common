# AWS Toolkit/Amazon Q for VSCode Telemetry

This package contains scripts and files to generate telemetry calls for:
- [AWS Toolkit for VS Code](https://github.com/aws/aws-toolkit-vscode/tree/master/packages/toolkit)
- [Amazon Q for VS Code](https://github.com/aws/aws-toolkit-vscode/tree/master/packages/amazonq).

## Usage

To generate telemetry and see the result:

1. run `npm run build` to produce the `lib/` dir.
2. run:
   ```
   node ./lib/generateTelemetry.js --output=telemetry.gen.ts
   ```
    - The script has two arguments:
        1. `--extraInput` list of paths to telemetry JSON files, seperated by commas. For example, "--extraInput=abc.json,/abc/bcd.json"
        2. `--output` path where the final output will go. For example, "--output=abc.ts"

To generate telemetry for VSCode from a downstream project,

1. install this package in your package.json
2. run:
   ```
   node node_modules/@aws-toolkits/telemetry/lib/generateTelemetry.js --output=<path/to/file>.ts
   ```
