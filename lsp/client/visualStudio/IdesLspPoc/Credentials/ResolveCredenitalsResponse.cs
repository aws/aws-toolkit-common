using Newtonsoft.Json;

namespace IdesLspPoc.Credentials
{
    /// <summary>
    /// Credentials response sent to the langauge server
    /// </summary>
    public class ResolveCredenitalsResponse
    {
        /// <summary>
        /// Initialization vector for encrypted data, in base64
        /// </summary>
        [JsonProperty("iv")]
        public string Iv;

        /// <summary>
        /// Encrypted data, in base64. The data contents will vary based on the request made.
        /// (eg: The payload is different when requesting IAM vs Bearer token)
        /// </summary>
        [JsonProperty("data")]
        public string Data;
    }
}
