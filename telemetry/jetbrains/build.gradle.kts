import org.everit.json.schema.Schema
import org.everit.json.schema.loader.SchemaLoader
import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.jetbrains.kotlin.gradle.dsl.JvmTarget
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile
import org.json.JSONObject

plugins {
    `kotlin-dsl`
    alias(libs.plugins.kotlin.jvm)
    `maven-publish`
    signing
    alias(libs.plugins.nexus.publishing)
}

java {
    withJavadocJar()
    withSourcesJar()
}

buildscript {
    repositories {
        mavenCentral()
        gradlePluginPortal()
    }
    dependencies {
        classpath(libs.json.schema)
    }
}

repositories {
    mavenCentral()
}

group = "software.aws.toolkits"

dependencies {
    implementation(libs.kotlin.poet)
    implementation(libs.jackson.module.kotlin)
    implementation(libs.json.schema)
    testImplementation(libs.junit4)
    testImplementation(libs.assertj)
}

tasks {
    withType<KotlinCompile> {
        compilerOptions.jvmTarget = JvmTarget.JVM_17
    }

    val validatePackagedSchema by registering {
        group = "build"
        description = "Validates that the packaged definition is compatible with the packaged schema"
        doFirst {
            try {
                val telemetrySchema = file("src/main/resources/telemetrySchema.json")
                val rawSchema = JSONObject(org.json.JSONTokener(telemetrySchema.readText()))
                val schema: Schema = SchemaLoader.load(rawSchema)
                file("src/main/resources/definitions").listFiles()!!.forEach {
                    schema.validate(JSONObject(it.readText()))
                }
            } catch (e: Exception) {
                println("Exception while validating packaged schema, ${e.printStackTrace()}")
                throw e
            }
        }
    }

    val copyTelemetryResources by registering(Copy::class) {
        from("..")
        include("*.json", "definitions/*.json")
        into("src/main/resources/")
    }

    val copyTestTelemetryResources by registering(Copy::class) {
        from("..")
        include("*.json", "definitions/*.json")
        into("src/test/resources/")
    }

    named("sourcesJar").configure {
        dependsOn(copyTelemetryResources)
    }

    compileKotlin {
        dependsOn(copyTelemetryResources, validatePackagedSchema)
    }

    compileTestKotlin {
        dependsOn(copyTestTelemetryResources)
    }

    processResources {
        dependsOn(copyTelemetryResources)
    }

    processTestResources {
        dependsOn(copyTestTelemetryResources)
    }
}

// maven can't handle this
tasks.withType<GenerateModuleMetadata> {
    enabled = false
}

tasks.withType<Test> {
    testLogging {
        exceptionFormat = TestExceptionFormat.FULL
    }
}

publishing {
    publications {
        create<MavenPublication>("mavenJava") {
            from(components["java"])
            pom {
                name.set(project.name)
                description.set("Telemetry generation for AWS Toolkit and Amazon Q for JetBrains")
                url.set("https://github.com/aws/aws-toolkit-common")
                licenses {
                    license {
                        name.set("The Apache License, Version 2.0")
                        url.set("http://www.apache.org/licenses/LICENSE-2.0.txt")
                    }
                    developers {
                        developer {
                            id.set("aws-toolkits")
                            name.set("AWS Toolkits Team")
                            email.set("aws-toolkits@amazon.com")
                        }
                    }
                    scm {
                        connection.set("scm:git:https://github.com/aws/aws-toolkit-common.git")
                        developerConnection.set("scm:git:https://github.com/aws/aws-toolkit-common.git")
                        url.set("https://github.com/aws/aws-toolkit-common")
                    }
                }
            }
        }
    }
}

// Disables the creation of an automatic publishing configuration
// This is because `kotlin-dsl` pulls in `java-gradle-plugin` which generates a new publication automatically
// We don't want to do two publications (this will clobber the first)
gradlePlugin { setAutomatedPublishing(false) }

signing {
    if (project.hasProperty("signing.keyId")
        && project.hasProperty("signing.password")
        && project.hasProperty("signing.secretKeyRingFile")) {
        sign(publishing.publications["mavenJava"])
    }
}

nexusPublishing {
    // This should ideally be removed and scoped down to our specific group, though it seems to be required for staging.
    // Originally added in https://github.com/aws/aws-toolkit-common/pull/40/files#diff-348889e112c6981a4641210b8e895e123b131ac6df5cdb7aac0de6d75acfb99eR149
    packageGroup.set("software.aws")

    repositories {
        sonatype {
            nexusUrl.set(uri("https://aws.oss.sonatype.org/service/local/"))
            snapshotRepositoryUrl.set(uri("https://aws.oss.sonatype.org/content/repositories/snapshots/"))
            username.set(project.findProperty("ossrhUsername") as? String)
            password.set(project.findProperty("ossrhPassword") as? String)

            // gotten using ./gradlew getStagingProfile with an older plugin (io.codearte.nexus-staging)
            stagingProfileId.set("29b8dd754a6907")
        }
    }
}
