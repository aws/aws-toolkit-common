package software.aws.toolkits.common.services.s3

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3Client

actual class S3Client actual constructor(region: String) {
    private val client = S3Client.builder().region(Region.of(region)).build()

    actual suspend fun createBucket(name: String) {
        withContext(Dispatchers.IO) {
            client.createBucket { it.bucket(name) }
        }
    }

    actual suspend fun listBuckets(): List<Bucket> = withContext(Dispatchers.IO) {
        client.listBuckets().buckets().map { Bucket(it.name()) }
    }

    actual suspend fun deleteBucket(name: String) {
        withContext(Dispatchers.IO) {
            client.deleteBucket { it.bucket(name) }
        }
    }
}