using Amazon.Runtime;
using Amazon.Runtime.CredentialManagement;
using IdesLspPoc.Credentials;
using IdesLspPoc.Output;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using StreamJsonRpc;
using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace IdesLspPoc.LspClient.S3
{
    /// <summary>
    /// Registered by the S3 Lsp Client to handle certain protocol messages
    /// </summary>
    public class S3LspMessageHandler
    {
        private static readonly object _aesSyncRoot = new object();
        private static readonly JsonSerializerSettings _serializerSettings = new JsonSerializerSettings
        {
            ContractResolver = new DefaultContractResolver
            {
                NamingStrategy = new CamelCaseNamingStrategy(),
            }
        };

        private OutputWindow _outputWindow;
        private readonly Aes _aes;

        public S3LspMessageHandler(OutputWindow outputWindow, Aes aes)
        {
            _outputWindow = outputWindow;
            _aes = aes;
        }

        /// <summary>
        /// Provides the language server with IAM credentials
        /// </summary>
        /// <param name="arg">JSON serialized <see cref="ResolveCredentialsResponse"/> object</param>
        /// <param name="token">Cancellation token</param>
        /// <returns>IAM credentials</returns>
        [JsonRpcMethod("$/aws/credentials/iam")]
        public async Task<ResolveCredentialsResponse> OnProvideIamCredentialsAsync(JToken arg, CancellationToken token)
        {
            _outputWindow.WriteLine("Client: Credentials have been requested");

            var request = arg.ToObject<ResolveCredentialsRequest>();

            // Here we would do some validation checks
            // TODO : check request.RequestId for uniqueness (eg: maintain a queue that auto-evicts after 5 minutes. Have an upper size limit, evict oldest ids if needed)
            // TODO : check request.IssuedOn for staleness (eg: 10 seconds)

            // PROOF OF CONCEPT
            // We will resolve the default profile from the local system.
            // In a product, the host extension would know which profile it is configured to provide to the language server.
            var creds = new SharedCredentialsFile();
            if (!creds.TryGetProfile("default", out var profile))
            {
                throw new Exception("Unable to get default profile");
            }

            AWSCredentials awsCredentials = profile.GetAWSCredentials(creds);
            return CreateResolveIamCredentialsResponse(await awsCredentials.GetCredentialsAsync(), _aes);
        }

        private static ResolveCredentialsResponse CreateResolveIamCredentialsResponse(ImmutableCredentials credentials, Aes aes)
        {
            var payload = new ResolveIamCredentialsResponseData
            {
                AccessKey = credentials.AccessKey,
                SecretKey = credentials.SecretKey,
                Token = credentials.Token,
                IssuedOn = new DateTimeOffset(DateTime.UtcNow).ToUnixTimeMilliseconds()
            };

            return CreateResolveIamCredentialsResponse(payload, aes);
        }

        /// <summary>
        /// Creates a response payload that contains encrypted data
        /// </summary>
        private static ResolveCredentialsResponse CreateResolveIamCredentialsResponse(object data, Aes aes)
        {
            byte[] iv = CreateInitializationVector(aes);
            var encryptor = aes.CreateEncryptor(aes.Key, iv);

            var json = JsonConvert.SerializeObject(data, _serializerSettings);

            using (var inputStream = new MemoryStream(Encoding.UTF8.GetBytes(json)))
            using (var outputStream = new MemoryStream())
            using (var encryptStream = new CryptoStream(outputStream, encryptor, CryptoStreamMode.Write))
            {
                inputStream.CopyTo(encryptStream);
                encryptStream.FlushFinalBlock();

                return new ResolveCredentialsResponse
                {
                    Iv = Convert.ToBase64String(iv),
                    Data = Convert.ToBase64String(outputStream.ToArray())
                };
            }
        }

        private static byte[] CreateInitializationVector(Aes aes)
        {
            lock (_aesSyncRoot)
            {
                aes.GenerateIV();
                return aes.IV;
            }
        }
    }
}