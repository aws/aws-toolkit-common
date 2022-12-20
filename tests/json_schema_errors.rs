use awsdocuments_language_server::parsers::json_schema::{
    errors::*, json_schema_parser::Validate, utils::parse,
};
use serde_json::{json, Value};
use tower_lsp::lsp_types::Diagnostic;

fn validate(input: &str, schema: Value) -> Vec<Diagnostic> {
    let parse_result = parse(input.to_string());
    let val = Validate::new(parse_result, schema, input.to_string());
    return val.validate();
}

#[test]
fn exclusive_maximum_invalid() {
    let validation_result = validate(
        "10",
        json!({
            "exclusiveMaximum": 5
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        exclusive_maximum_error(5.0, 10.0)
    );
}

#[test]
fn exclusive_minimum_invalid() {
    let validation_result = validate(
        "2",
        json!({
            "exclusiveMinimum": 5
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        exclusive_minimum_error(5.0, 2.0)
    );
}

#[test]
fn enum_invalid() {
    let validation_result = validate("10", json!({"enum": [1]}));
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        enum_error(vec!(String::from("1")), String::from("10"))
    );
}

#[test]
fn enum_invalid_multiple() {
    let validation_result = validate("10", json!({"enum": [1, 2, 3]}));
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        enum_error(
            vec!(String::from("1"), String::from("2"), String::from("3")),
            String::from("10")
        )
    );
}

#[test]
fn type_invalid_type() {
    let validation_result = validate("2", json!({"type": "string"}));
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        type_error(String::from("string"), String::from("number"))
    );
}

#[test]
fn type_invalid_types_array() {
    let validation_result = validate("2", json!({"type": ["string", "boolean"]}));
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        type_error(String::from("string, boolean"), String::from("number"))
    );
}

#[test]
fn max_items_invalid() {
    let validation_result = validate(
        "[1,2,3]",
        json!({
            "maxItems": 1
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, expected_items_error(1, 3));
}

#[test]
fn max_length_invalid() {
    let validation_result = validate(
        "\"test\"",
        json!({
            "maxLength": 2
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, expected_length_error(2, 4));
}

#[test]
fn max_properties_invalid() {
    let validation_result = validate(
        "{\"foo\": 1, \"bar\": 2, \"baz\": 3}",
        json!({
            "maxProperties": 2
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        expected_properties_error(2, 3)
    );
}

#[test]
fn maximum_invalid() {
    let validation_result = validate(
        "5",
        json!({
            "maximum": 3.0
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, maximum_error(3.0, 5.0));
}

#[test]
fn maximum_invalid_with_exclusive_maximum() {
    let validation_result = validate(
        "5",
        json!({
            "maximum": 3.0,
            "exclusiveMaximum": 4.0
        }),
    );
    assert_eq!(validation_result.len(), 2, "Expected 2 errors");
    assert_eq!(
        validation_result[0].message,
        exclusive_maximum_error(4.0, 5.0)
    );
    assert_eq!(validation_result[1].message, maximum_error(4.0, 5.0));
}

#[test]
fn maximum_invalid_with_exclusive_maximum_true() {
    let validation_result = validate(
        "5",
        json!({
            "maximum": 3.0,
            "exclusiveMaximum": true
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, maximum_error(3.0, 5.0));
}

#[test]
fn maximum_invalid_with_exclusive_maximum_false() {
    let validation_result = validate(
        "5",
        json!({
            "maximum": 3.0,
            "exclusiveMaximum": false
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, maximum_error(3.0, 5.0));
}

#[test]
fn min_items_invalid() {
    let validation_result = validate(
        "[1,2,3]",
        json!({
            "minItems": 5
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, expected_items_error(5, 3));
}

#[test]
fn min_length_invalid() {
    let validation_result = validate(
        "\"test\"",
        json!({
            "minLength": 10
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, expected_length_error(10, 4));
}

#[test]
fn min_properties_invalid() {
    let validation_result = validate(
        "{\"foo\": 1, \"bar\": 2, \"baz\": 3}",
        json!({
            "minProperties": 5
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        expected_properties_error(5, 3)
    );
}

#[test]
fn minimum_invalid() {
    let validation_result = validate(
        "1",
        json!({
            "minimum": 3.0
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, minimum_error(3.0, 1.0));
}

#[test]
fn minimum_invalid_with_exclusive_minimum() {
    let validation_result = validate(
        "1",
        json!({
            "minimum": 3.0,
            "exclusiveMinimum": 4.0
        }),
    );
    assert_eq!(validation_result.len(), 2, "Expected 2 errors");
    assert_eq!(
        validation_result[0].message,
        exclusive_minimum_error(4.0, 1.0)
    );
    assert_eq!(validation_result[1].message, minimum_error(3.0, 1.0));
}

#[test]
fn minimum_invalid_with_exclusive_minimum_true() {
    let validation_result = validate(
        "1",
        json!({
            "minimum": 3.0,
            "exclusiveMinimum": true
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, minimum_error(3.0, 1.0));
}

#[test]
fn minimum_invalid_with_exclusive_minimum_false() {
    let validation_result = validate(
        "1",
        json!({
            "minimum": 3.0,
            "exclusiveMinimum": false
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, minimum_error(3.0, 1.0));
}

#[test]
fn multiple_of_invalid() {
    let validation_result = validate(
        "35",
        json!({
            "multipleOf": 1.5
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(validation_result[0].message, multiple_of_error(1.5, 35.0));
}

#[test]
fn pattern_invalid() {
    let validation_result = validate(
        "\"abc\"",
        json!({
            "pattern": "^a*$"
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        pattern_error(String::from("^a*$"), String::from("abc"))
    );
}

#[test]
fn required_invalid() {
    let validation_result = validate(
        "{\"bar\": 1}",
        json!({
            "properties": {
                "foo": {},
                "bar": {}
            },
            "required": ["foo"]
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        required_error(String::from("foo"))
    );
}

#[test]
fn required_invalid_multiple_items() {
    let validation_result = validate(
        "{\"baz\": 1}",
        json!({
            "properties": {
                "foo": {},
                "bar": {}
            },
            "required": ["foo", "bar"]
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        required_error(String::from("bar, foo"))
    );
}

#[test]
fn unique_items_invalid() {
    let validation_result = validate(
        "[1, 1]",
        json!({
            "uniqueItems": true
        }),
    );
    assert_eq!(validation_result.len(), 1, "Expected 1 error");
    assert_eq!(
        validation_result[0].message,
        unique_items_error(String::from("1"))
    );
}
