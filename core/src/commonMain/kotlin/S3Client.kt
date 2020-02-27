package software.aws.toolkits.common.services.s3

data class Bucket(val name: String)

expect class S3Client(region: String) {
    suspend fun createBucket(name: String)
    suspend fun listBuckets(): List<Bucket>
    suspend fun deleteBucket(name: String)
}