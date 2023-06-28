using IdesLspPoc.ContentDefinitions;
using IdesLspPoc.LspClient.S3;
using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Utilities;
using StreamJsonRpc;
using System;
using System.ComponentModel.Composition;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace IdesLspPoc.LspClient
{
    /// <summary>
    /// This is a sample integration that provides S3 bucket names as completion text for
    /// files named "*.s3.json".
    /// </summary>

    // for some reason, we have associate LSPs with JSON using a custom type - see JsonContentType for comments
    [ContentType(JsonContentType.ContentTypeName)]

    [Export(typeof(ILanguageClient))]
    public class S3LspClient : ToolkitLspClient, ILanguageClientCustomMessage2
    {
        /// <summary>
        /// Name of Language Client; displayed to user
        /// For example, if the LSP writes logs to an output window, this is where they will appear
        /// </summary>
        public override string Name => "AWS Toolkit language client for Amazon S3";

        public override object InitializationOptions
        {
            get
            {
                // This is how we configure the behavior of AWS Language Servers.
                // The structure needs to be formalized across all AWS hosts/extensions.
                //
                // This structure is exploration/conceptual/speculative at this time.
                // See lsp\core\aws-lsp-core\src\initialization\awsInitializationOptions.ts
                return new
                {
                    // CONCEPT: We signal that we can provide credentials.
                    // We initialize the server with an encryption key. The server requests credentials, and will
                    // decrypt them with this key.
                    credentials = new
                    {
                        providesIam = true,
                        providerKey = Convert.ToBase64String(_aes.Key),
                    }
                };
            }
        }

        private readonly Aes _aes;

        public S3LspClient()
        {
            _aes = Aes.Create();
            _aes.Mode = CipherMode.CBC;
            _aes.KeySize = 256;
            _aes.GenerateKey();
        }

        protected override string GetServerWorkingDir()
        {
            // to try using this extension, update dir to wherever your lsp service executable is
            return @"C:\code\aws-toolkit-common\lsp\app\aws-lsp-s3-binary\bin";
        }

        protected override string GetServerPath()
        {
            return $@"{GetServerWorkingDir()}\aws-lsp-s3-binary-win.exe";
        }

        public override Task OnLoadedAsync()
        {
            // This is what allows the extension to handle requests for credentials from the language server
            CustomMessageTarget = new S3LspMessageHandler(_outputWindow, _aes);

            return base.OnLoadedAsync();
        }

        #region ILanguageClientCustomMessage2

        private JsonRpc _rpc;
        public object MiddleLayer => null;

        /// <summary>
        /// Allows extensions to handle LSP messages
        /// Must be set before starting the language server (occurs in the base class OnLoadedAsync)
        /// https://learn.microsoft.com/en-us/dotnet/api/microsoft.visualstudio.languageserver.client.ilanguageclientcustommessage2.custommessagetarget?view=visualstudiosdk-2022#microsoft-visualstudio-languageserver-client-ilanguageclientcustommessage2-custommessagetarget
        /// </summary>
        public object CustomMessageTarget { get; private set; }

        public Task AttachForCustomMessageAsync(JsonRpc rpc)
        {
            _rpc = rpc;

            return Task.CompletedTask;
        }

        #endregion
    }
}