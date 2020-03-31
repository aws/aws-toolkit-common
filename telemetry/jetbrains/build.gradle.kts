import org.everit.json.schema.Schema
import org.everit.json.schema.loader.SchemaLoader
import org.json.JSONObject

val jacksonVersion = "2.10.0"
val junitVersion = "4.13"
val kotlinVersion = "1.3.20"
val assertjVersion = "3.12.0"

plugins {
    java
    `kotlin-dsl`
    kotlin("jvm") version "1.3.61"
    `maven-publish`
    signing
}

java {
    withJavadocJar()
    withSourcesJar()
}

buildscript {
    repositories {
        mavenCentral()
        maven { setUrl("https://jitpack.io") }
        maven { setUrl("https://plugins.gradle.org/m2/") }
    }
    dependencies {
        "classpath"(group = "com.github.everit-org.json-schema", name = "org.everit.json.schema", version = "1.12.1")
        classpath(kotlin("gradle-plugin", version = "1.3.20"))
    }
}

repositories {
    mavenCentral()
    maven { setUrl("https://jitpack.io") }
}

group = "software.aws.toolkits"

dependencies {
    implementation(kotlin("stdlib-jdk8"))
    implementation("com.squareup:kotlinpoet:1.5.0")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:$jacksonVersion")
    implementation("com.github.everit-org.json-schema:org.everit.json.schema:1.12.1")
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
