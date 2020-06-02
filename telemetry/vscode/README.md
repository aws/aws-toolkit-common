# AWS Toolkit for VSCode Telemetry

This package contains scripts and files to generate telemetry calls for the [AWS Toolkit for VS Code](https://github.com/aws/aws-toolkit-vscode).

## Usage

To generate telemetry for VSCode, install this package in your package.json, then run:

`node node_modules/@aws-toolkits/telemetry/lib/generateTelemetry.js --output=<path/to/file>.ts`

The script has two arguments:

1. `--extraInput` accepts lists of paths to telemetry JSON files, seperated by commas. For example, "--extraInput=abc.json,/abc/bcd.json"
2. `--output` accepts one path which represents where the final output will go. For example, "--output=abc.ts"
   //
