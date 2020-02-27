package software.aws.toolkits.common

inline fun <T : Any> jsObject(builder: T.() -> Unit): T {
    val obj: T = js("({})").unsafeCast<T>()
    return obj.apply {
        builder()
    }
}