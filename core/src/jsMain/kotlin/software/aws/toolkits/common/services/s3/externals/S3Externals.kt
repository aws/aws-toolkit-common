@file:JsModule("@aws-sdk/client-s3-node")
@file:JsNonModule
package software.aws.toolkits.common.services.s3.externals

import kotlin.js.Promise

external interface S3Configuration {
    var region: String?
        get() = definedExternally
        set(value) = definedExternally
}

external class S3(config: S3Configuration) {
    fun listBuckets(args: ListBucketsInput): Promise<ListBucketsOutput>
    fun createBucket(args: CreateBucketInput): Promise<CreateBucketOutput>
    fun deleteBucket(args: DeleteBucketInput): Promise<DeleteBucketOutput>
}

external interface ListBucketsInput

external interface ListBucketsOutput  {
    var Buckets: Array<Bucket>?
        get() = definedExternally
        set(value) = definedExternally
}

external interface CreateBucketInput {
    var Bucket: String?
        get() = definedExternally
        set(value) = definedExternally
}

external interface CreateBucketOutput

external interface Bucket {
    var Name: String?
        get() = definedExternally
        set(value) = definedExternally
}

external interface DeleteBucketInput {
    var Bucket: String?
        get() = definedExternally
        set(value) = definedExternally
}

external interface DeleteBucketOutput