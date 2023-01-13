# AWS Documents Language Server

The AWS Documents is a yaml/json language server supporting AWS document types. This project implements the language server side of the language server protocol. Here you can find the implementations for parsing, validating, hover, and auto completion for aws file types.

### Supported file types
- Buildspec

### Usage
Since the code here is just a language server, it doesn't do anything until you hook it up to an editor that supports the language server protocol.

#### VSCode
For VSCode, the changes that implements the client/editor side support currently lives in the `jpinkney-aws/lsp` branch.

In order to setup the language server with VSCode as the language client, ensure that both the `aws-toolkit-vscode` project and the `aws-toolkit-common` project are cloned under the same parent folder. This is because VSCode currently looks for the language server relative to itself.

E.g.
```
parent-folder/
  aws-toolkit-common # Holds the language server implementation
  aws-toolkit-vscode # Holds the logic that will execute and connects to the LS
```

Once you have the folder structure setup:

```bash
cd aws-toolkit-common
cargo build
```
This will produce a language server binary in `aws-toolkit-common/lsp/target/debug` that will be used by VSCode.

From there, enable the `aws.experiments.lsp` setting in VSCode and then run the extension as normal. The language server as a proof of concept will only provide support for `build.json` "buildspec" files, until we integrate a YAML parser.

### Debugging
Since a language server is it's own seperate implementation away from the editor, debugging the language server will be code editor specific.

#### VSCode
In VSCode, you typically debug the language server by creating a test and then using the debug codelens in VSCode to investigate further without having to connect the language server to an editor.

However, you can also debug the language server by connecting the language server directly to VSCode and then attaching your debugger to it. In VSCode, this is done by first setting up the language server according to [VSCode](#vscode) and then using the `Extension + Attach to AWS Documents Language Server` launch configuration. This will build the language server, start the VSCode extension, and connect the debugger. From there, you can set breakpoints in either VSCode or in the language server as required.

### Testing
Cargo has multiple ways to test the project. To test the entire project:
```bash
cargo test
```

to run a specific test you can use:
```bash
cargo test ${my-test-name}
```

to only run the integration tests (tests in the `tests/` folder) you can use:
```bash
cargo test --test '*'
```

### Contributing
Pull requests are welcome. If the feature is large, please open an issue first to discuss the changes you would like to make.

This project is entirely test driven development. Each pull requires a set of supporting tests. If for some reason the functionality you are working on can't be tested, please justify why in the commit message and on the pull request.

### Additional Interesting Links

[LSP](https://microsoft.github.io/language-server-protocol/)

### License
[Apache 2.0](../LICENSE)