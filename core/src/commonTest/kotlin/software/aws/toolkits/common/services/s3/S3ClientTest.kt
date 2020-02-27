package software.aws.toolkits.common.services.s3

import software.aws.toolkits.common.utils.runTest
import kotlin.random.Random
import kotlin.test.Test
import kotlin.test.assertTrue

class S3ClientTest {
    private val bucketName = "toolkits-common-test-bucket-${Random.nextInt()}"

    @Test
    fun canInteractWithBucketsAcrossPlatform() = runTest {
        val client = S3Client("us-west-2")

        client.createBucket(bucketName)
        assertTrue(client.listBuckets().any { it.name == bucketName })
        client.deleteBucket(bucketName)
        assertTrue(client.listBuckets().none { it.name == bucketName })
    }
}