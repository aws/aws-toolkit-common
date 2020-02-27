import org.everit.json.schema.Schema
import org.everit.json.schema.loader.SchemaLoader
import org.json.JSONObject

plugins {
    kotlin("jvm")
    java
    id("maven-publish")
    signing
}

val jacksonVersion = "2.10.0"
val junitVersion = "4.13"
val assertjVersion = "3.12.0"

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
        classpath(group = "com.github.everit-org.json-schema", name = "org.everit.json.schema", version = "1.12.1")
    }
}

repositories {
    mavenCentral()
    maven { setUrl("https://jitpack.io") }
}

dependencies {
    implementation(kotlin("stdlib-jdk8"))
    implementation(gradleApi())
    implementation("com.squareup:kotlinpoet:1.5.0")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin:$jacksonVersion")
    implementation("com.github.everit-org.json-schema:org.everit.json.schema:1.12.1")
    testImplementation("junit:junit:$junitVersion")
    testImplementation("org.assertj:assertj-core:$assertjVersion")
}

tasks {
    processResources {
        from("..")
        include("*.json", "definitions/*.json")
    }

    task("validatePackagedSchema") {
        group = "verification"
        description = "Validates that the packaged definition is compatable with the packaged schema"
        doFirst {
            try {
                val telemetrySchema = project.buildDir.resolve("resources/main/telemetrySchema.json")
                val rawSchema = JSONObject(org.json.JSONTokener(telemetrySchema.readText()))
                val schema: Schema = SchemaLoader.load(rawSchema)
                project.buildDir.resolve("resources/main/definitions").listFiles()!!.forEach {
                    schema.validate(JSONObject(it.readText()))
                }
            } catch (e: Exception) {
                println("Exception while validating packaged schema, ${e.printStackTrace()}")
                throw e
            }
        }
    }
}

val validatePackagedSchema = tasks.getByName("validatePackagedSchema")
validatePackagedSchema.dependsOn(tasks.getByName("processResources"))
tasks.getByName("check").dependsOn(validatePackagedSchema)

// maven can't handle this
tasks.withType<GenerateModuleMetadata> {
    enabled = false
}

publishing {
    publications {
        create<MavenPublication>("maven") {
            from(components["java"])
            pom {
                name.set("telemetry-generator")
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
