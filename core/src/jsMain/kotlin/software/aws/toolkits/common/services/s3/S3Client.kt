package software.aws.toolkits.common.services.s3

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.await
import kotlinx.coroutines.withContext
import software.aws.toolkits.common.jsObject
import software.aws.toolkits.common.services.s3.externals.S3

actual class S3Client actual constructor(region: String) {

    private val s3 = S3(jsObject { this.region = region })

    actual suspend fun createBucket(name: String) {
        withContext(Dispatchers.Main) {
            s3.createBucket(jsObject { Bucket = name }).await()
        }
    }

    actual suspend fun listBuckets(): List<Bucket> = withContext(Dispatchers.Main) {
        s3.listBuckets(jsObject { }).then { resp -> resp.Buckets?.mapNotNull { bucket -> bucket.Name?.let { Bucket(it) } } ?: emptyList() }.await()
    }

    actual suspend fun deleteBucket(name: String) {
        withContext(Dispatchers.Main) {
            s3.deleteBucket(jsObject { Bucket = name }).await()
        }
    }
}