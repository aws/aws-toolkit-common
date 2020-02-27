pluginManagement {
    repositories {
        maven { url = uri("https://dl.bintray.com/kotlin/kotlin-eap") }
        maven { url = uri("https://kotlin.bintray.com/kotlinx") }

        gradlePluginPortal()
    }
}

rootProject.name = "aws-toolkit-common"

enableFeaturePreview("GRADLE_METADATA")

fun module(path: String, name: String? = null) {
    val projectName = name ?: path.replace('\\', '/').substringAfterLast('/')
    include(projectName)
    project(":$projectName").projectDir = file(path)
}

module("core")
module("telemetry/jetbrains", "telemetry-generator")