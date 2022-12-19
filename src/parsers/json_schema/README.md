## JSON Schema Module

This module implements a validator for the JSON Schema draft 4 specification. It's emphasis is on providing usable error messages to end users.

### Current JSON Schema Support

Currently this project implements JSON Schema draft 4 with a few exceptions:
- No support for optional bignums
- No support for optional ecmascript-regex
- No support for oneOf, anyOf, allOf

### Setup

In order to setup and tests against the JSON Schema specification you must first clone the json schema test suite into this folder.

If you are cloning from the root of the project:

```bash
git clone https://github.com/json-schema-org/JSON-Schema-Test-Suite.git src/parsers/json_schema/test_suite
```

If you are cloning from this directory:

```bash
git clone https://github.com/json-schema-org/JSON-Schema-Test-Suite.git test_suite
```

### Running Tests
The test suite can then be launched from the code-lens in [test.rs](./tests.rs).

The `json_schema_test_suite_include` macro allows you to specify files that you would like to test against as a regex.

E.g.
```rust
#[json_schema_test_suite_include("src/parsers/json_schema/test_suite/tests/", "draft4", { ".*" })]
```

will run every draft 4 JSON Schema test against the JSON Schema parser.

```rust
#[json_schema_test_suite_include("src/parsers/json_schema/test_suite/tests/", "draft4", { "max_items.*" })]
```

will run all max items tests draft 4 JSON Schema tests against the JSON Schema parser.
