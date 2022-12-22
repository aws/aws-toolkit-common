use crate::parsers::parser::Parser;

use super::{json_schema_parser::JSONSchemaValidator, utils::ir::parse};
#[cfg(test)]
use awsdocuments_language_server_derive::json_schema_test_suite_include;
use json_schema_test_suite::{json_schema_test_suite, TestCase};

// Currently failing known tests:
// maxLength failures: maxLength_0_4 - unicode parsing issue
// minLength failures: minLength_0_4 - unicode parsing issue
// required failures: required_2_0 - some weird spacing issue on the keys (potentially serde issue?)
// multipleOf failures: multipleOf_2_0 - big floats fail to divide correctly
// enum failures: enum_4_0, enum_4_1 - spaces in keys (serde can't handle) and enum_9_0 - unicode parsing issue

/**
 * Currently passing all tests
 * additionalItems
 * maxItems
 * minItems
 * maxProperties
 * minProperties
 * maximum
 * minimum
 * patternProperties
 * additionalProperties
 * type
 */

#[json_schema_test_suite_include("src/parsers/json_schema/test_suite/tests/", "draft4", { ".*" })]
// #[json_schema_test_suite("src/parsers/json_schema/test_suite", "draft4", { "**pattern**" })]
fn test_suite(_server_address: &str, test_case: TestCase) {
    let parse_result = parse(test_case.instance.to_string());

    let schema = test_case.schema.clone();
    let val = JSONSchemaValidator::new(parse_result, schema, test_case.instance.to_string());
    let errors = val.parse().errors;
    if test_case.is_valid {
        if !errors.is_empty() {
            panic!(
                "Test case {} was expected to be valid.\n    Schema={}\n    Instance={}",
                test_case.name,
                test_case.schema.clone(),
                test_case.instance
            );
        }
    } else if errors.is_empty() {
        panic!(
            "Test case {} was expected to be invalid.\n    Schema={}\n    Instance={}",
            test_case.name,
            test_case.schema.clone(),
            test_case.instance
        );
    }
}
