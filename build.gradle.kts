import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
    kotlin("multiplatform") version "1.3.61" apply false
    kotlin("jvm") version "1.3.61" apply false
}

subprojects {
    repositories {
        mavenCentral()
    }

    group = "software.aws.toolkits"
    version = "0.0.1"

    tasks.withType<KotlinCompile> {
        kotlinOptions.jvmTarget = "1.8"
    }
}
