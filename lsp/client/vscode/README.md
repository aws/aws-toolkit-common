# Proof of Concept: AWS Documents LSP Client integration into VS Code

This is an example Visual Studio extension that wraps an experimental LSP service. The repo contains more than one language server, but this extension is only used to launch one server. To launch a specific server with this extension, set the `LSP_SERVER` environment variable prior to launching this extension. `LSP_SERVER` should be set to the .js file that `node` should launch. See [/lsp/.vscode/launch.json](/lsp/.vscode/launch.json) for examples.

# Working Credentials example

This extension contains functioning code that shows an example of how extensions can resolve AWS credentials, then pass them to the server using encryption. To enable this feature in the extension, launch the extension with ENABLE_IAM_PROVIDER set to `true`.

The intent behind this concept code is to show how an extension could "push" credentials to the server whenever they are resolved (eg: when a user configures credentials for use with the server, or when the credentials have been refreshed). To simulate these events, the following commands can be run from the extension:

-   awslsp.selectProfile - used to simulate when credentials are pushed to the server. When you run this command, you will be prompted to enter a profile name. This profile's credentials will be resolved from your shared credentials file, then pushed to the server. (Only basic access key - secret key credentials type is supported in this example).
-   awslsp.clearProfile - used to simulate when credentials are removed from the server

The S3 bucket listing server has been set up as a working example.
