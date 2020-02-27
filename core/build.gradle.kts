plugins {
    kotlin("multiplatform")
    id("maven-publish")
}

kotlin {
    jvm()
    js {
        nodejs {
        }
    }

    sourceSets {
        commonMain {
            dependencies {
                implementation(kotlin("stdlib-common"))
            }
        }
        commonTest {
            dependencies {
                implementation(kotlin("test-common"))
                implementation(kotlin("test-annotations-common"))
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-common:1.3.2")
                implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.3.2")
            }
        }

        jvm {
            compilations {
                "main" {
                    dependencies {
                        implementation(kotlin("stdlib-jdk8"))
                        implementation("software.amazon.awssdk:s3:2.10.73")
                        implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.3.2")
                    }
                }

                "test" {
                    dependencies {
                        implementation(kotlin("test"))
                        implementation(kotlin("test-junit"))
                    }
                }
            }
        }

        js {
            compilations {
                "main" {
                    dependencies {
                        implementation(npm("@aws-sdk/client-s3-node", "^0.1.0-preview.2"))
                        implementation(kotlin("stdlib-js"))
                        implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core-js:1.3.2")
                    }
                }

                "test" {
                    dependencies {
                        implementation(kotlin("test-js"))
                    }
                }
            }
        }
    }
}