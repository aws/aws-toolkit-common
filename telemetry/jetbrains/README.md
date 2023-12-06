# Usage

1. To your buildSrc build.gradle, add:
    ```groovy
    compile "software.amazon:toolkits.telemetry.generator:1.0"
    ```
   
    to the `dependencies` as well as
    
    ```groovy
    maven { url "https://jitpack.io" }
    ```
    
    to the `repositories` section (this is needed for json schema validation)
2. In the project build.gradle, add
    ```
   task generateTelemetry(type: GenerateTelemetry) {
       inputFiles = [<array of IDE specific files>]
       outputDirectory = file(<output directory>)
   }
    ```
3. Finally, make the build depend on it:
   ```groovy
    compileJava.dependsOn(generateTelemetry)
    ```
To add additional telemetry files, add `file("/path/to/file)` entries into the inputFiles array.

## Testing 

### Running Tests

To run the tests you can run them from this directory `telemetry/jetbrains` with the `./gradlew test` command.