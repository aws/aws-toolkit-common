# Usage

To generate telemtry for VSCode, install this package in your package.json, then run:

`node node_modules/aws-toolkit-telemetry/out/generateTelemetry.js --output=<path/to/file>.ts`

The script has two arguments:

1. `--input` accepts lists of paths to telemetry JSON files, seperated by commas. For example, "--input=abc.json,/abc/bcd.json"
2. `--output` accepts one path which represents where the final output will go. For example, "--output=abc.ts"
