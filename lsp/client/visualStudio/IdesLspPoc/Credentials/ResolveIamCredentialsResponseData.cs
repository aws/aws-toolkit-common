namespace IdesLspPoc.Credentials
{
    public class ResolveIamCredentialsResponseData
    {
        public string AccessKey;
        public string SecretKey;
        public string Token;
        public long IssuedOn; // adds variation to the encrypted payload
    }
}