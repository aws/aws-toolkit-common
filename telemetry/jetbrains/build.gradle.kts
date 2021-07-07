import org.everit.json.schema.Schema
import org.everit.json.schema.loader.SchemaLoader
import org.gradle.api.tasks.testing.logging.TestExceptionFormat
import org.json.JSONObject

val jacksonVersion = "2.12.4"
val junitVersion = "4.13.2"
val kotlinVersion = "1.3.20"
val assertjVersion = "3.19.0"

plugins {
    java
    `kotlin-dsl`
    kotlin("jvm") version "1.5.0"
    `maven-publish`
    signing
    id("io.codearte.nexus-staging") version "0.30.0"
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
        classpath("com.github.erosb:everit-json-schema:1.12.2")
        classpath(kotlin("gradle-plugin", version = "1.3.20"))
    }
}

repositories {
    mavenCentral()
}

group = "software.aws.toolkits"

dependencies {
    implementation(kotlin("stdlib-jdk8"))
    implementation("com.squareup:kotlinpoet:1.8.0")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:$jacksonVersion")
    implementation("com.github.erosb:everit-json-schema:1.12.2")
    testImplementation("junit:junit:$junitVersion")
    testImplementation("org.assertj:assertj-core:$assertjVersion")
}

tasks {
    compileKotlin {
        dependsOn(":copyTelemetryResources", ":validatePackagedSchema")
        kotlinOptions.jvmTarget = "1.8"
    }
    compileTestKotlin {
        dependsOn(":copyTestTelemetryResources")
        kotlinOptions.jvmTarget = "1.8"
    }
    register("validatePackagedSchema") {
        group = "build"
        description = "Validates that the packaged definition is compatable with the packaged schema"
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
    task(name = "copyTelemetryResources", type = Copy::class) {
        from("..")
        include("*.json", "definitions/*.json")
        into("src/main/resources/")
    }
    task(name = "copyTestTelemetryResources", type = Copy::class) {
        from("..")
        include("*.json", "definitions/*.json")
        into("src/test/resources/")
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
        create<MavenPublication>("maven") {
            from(components["java"])
            pom {
                name.set(project.name)
                description.set("Telemetry generation for AWS Toolkit for JetBrains")
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
    repositories {
        maven {
            name = "sonatype"
            url = if (!version.toString().endsWith("SNAPSHOT")) {
                uri("https://aws.oss.sonatype.org/service/local/staging/deploy/maven2/")
            } else {
                uri("https://aws.oss.sonatype.org/content/repositories/snapshots/")
            }
            credentials {
                username = project.findProperty("ossrhUsername") as? String
                password = project.findProperty("ossrhPassword") as? String
            }
        }
    }
}

signing {
    if (project.hasProperty("signing.keyId")
        && project.hasProperty("signing.password")
        && project.hasProperty("signing.secretKeyRingFile")) {
        sign(publishing.publications["maven"])
    }
}

nexusStaging {
    packageGroup = "software.aws"
    serverUrl = "https://aws.oss.sonatype.org/service/local/"
    // gotten using ./gradlew getStagingProfile
    stagingProfileId = "29b8dd754a6907"
    username = project.findProperty("ossrhUsername") as? String
    password = project.findProperty("ossrhPassword") as? String
}

