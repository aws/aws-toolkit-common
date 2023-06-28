namespace IdesLspPoc.Credentials
{
    public class ResolveIamCredenitalsResponseData
    {
        public string AccessKey;
        public string SecretKey;
        public string Token;
        public long IssuedOn; // adds variation to the encrypted payload
    }
}