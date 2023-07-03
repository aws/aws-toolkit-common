namespace IdesLspPoc.Credentials
{
    /// <summary>
    /// Request for credentials from the langauge server
    /// </summary>
    public class ResolveCredentialsRequest
    {
        /// <summary>
        /// Unique Id of request for IAM Credentials
        /// </summary>
        public string RequestId;

        /// <summary>
        /// When the request was produced, in milliseconds since Unix Epoch
        /// </summary>
        public long IssuedOn;
    }
}