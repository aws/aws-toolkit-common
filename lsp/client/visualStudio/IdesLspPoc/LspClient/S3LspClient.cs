using IdesLspPoc.ContentDefinitions;
using Microsoft.VisualStudio.LanguageServer.Client;
using Microsoft.VisualStudio.Utilities;
using System;
using System.ComponentModel.Composition;
using System.Net;

namespace IdesLspPoc.LspClient
{
    /// <summary>
    /// This is a sample integration that provides S3 bucket names as completion text for
    /// files named "*.s3.json".
    /// </summary>

    // for some reason, we have associate LSPs with JSON using a custom type - see JsonContentType for comments
    [ContentType(JsonContentType.ContentTypeName)]

    [Export(typeof(ILanguageClient))]
    public class S3LspClient : ToolkitLspClient
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
                return new
                {
                    credentials = new
                    {
                        providesIam = true
                    }
                };
            }
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
    }
}