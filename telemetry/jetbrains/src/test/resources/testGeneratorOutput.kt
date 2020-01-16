// THIS FILE IS GENERATED! DO NOT EDIT BY HAND!
package software.aws.toolkits.telemetry

import com.intellij.openapi.project.Project
import kotlin.Any
import kotlin.Boolean
import kotlin.Double
import kotlin.Int
import kotlin.String
import software.amazon.awssdk.services.toolkittelemetry.model.Unit
import software.aws.toolkits.jetbrains.services.telemetry.TelemetryService

/**
 * The lambda runtime
 */
enum class LambdaRuntime(
    name: String
) {
    DOTNETCORE21("dotnetcore2.1"),

    NODEJS12X("nodejs12.x");

    override fun toString(): String = name

    fun from(type: Any): LambdaRuntime = values().filter { it.name == type.toString() }.first()
}

object LambdaTelemetry {
    /**
     * called when creating lambdas remotely
     */
    fun recordCreate(
        project: Project?,
        value: Double = 1.0,
        lambdaruntime: LambdaRuntime,
        arbitrarystring: String
    ) {
        TelemetryService.getInstance().record(project) {
            datum("lambda_create") {
                unit(Unit.NONE)
                value(value)
                metadata("lambdaruntime", lambdaruntime.toString())
                metadata("arbitrarystring", arbitrarystring.toString())
            }}
    }

    /**
     * called when deleting lambdas remotely
     */
    fun recordDelete(
        project: Project?,
        value: Double = 1.0,
        duration: Double,
        booltype: Boolean
    ) {
        TelemetryService.getInstance().record(project) {
            datum("lambda_delete") {
                unit(Unit.NONE)
                value(value)
                metadata("duration", duration.toString())
                metadata("booltype", booltype.toString())
            }}
    }

    /**
     * called when invoking lambdas remotely
     */
    fun recordRemoteinvoke(
        project: Project?,
        value: Double = 1.0,
        lambdaruntime: LambdaRuntime,
        inttype: Int
    ) {
        TelemetryService.getInstance().record(project) {
            datum("lambda_remoteinvoke") {
                unit(Unit.NONE)
                value(value)
                metadata("lambdaruntime", lambdaruntime.toString())
                metadata("inttype", inttype.toString())
            }}
    }
}
