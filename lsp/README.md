# AWS Documents Language Server

Language server for AWS File types

## Functionality

This Language Server currently supports completion, hover, diagnostics for the following file types:
- Buildspec

## Structure

```
.
── src
    └── server.ts // Language Server entry point
    └── registry.ts // Registry of items
    └── service.ts // Interfaces for Language Service and implementation of Backend Services that we call into (json language service, yaml language service)
    └── utils/
        └── file.ts // Utilities for interacting with files
    └── filetypes/ // Folder where filetype implementations live 
```

## Building a standalone language server

This project currently supports building a standalone language server through [pkg](https://github.com/vercel/pkg). pkg takes the project and packages it into an executable alongside a node binary.

In order to build the standalone language server first install the pkg cli
```bash
npm install pkg -g
```

Now you have the ability to create standalone language server executables depending on the arguments you pass into pkg.

If you want to create windows-x64, macos-x64, linux-x64 binaries you can use:
```bash
pkg .
```

to create a standalone executable for node16 for windows on arm you can do
```bash
pkg --targets node16-windows-arm64 .
```

to ensure the standalone language server is compressed even more you can do:
```bash
pkg --compress GZip .
```
