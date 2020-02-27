package software.aws.toolkits.common.utils

import kotlinx.coroutines.CoroutineScope

expect fun runTest(block: suspend (scope: CoroutineScope) -> Unit)