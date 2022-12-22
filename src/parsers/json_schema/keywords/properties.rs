use std::collections::HashMap;

use serde_json::Value;
use tree_sitter::Node;

use crate::parsers::{
    json_schema::{json_schema_parser::JSONSchemaValidator, utils::object::Properties},
    parser::ParseResult,
};

pub fn validate_properties(
    validate: &JSONSchemaValidator,
    available_keys: &HashMap<String, Node>,
    sub_schema: &Value,
) -> Option<Properties> {
    let properties = sub_schema.get("properties")?.as_object()?;

    let mut validations: Vec<ParseResult> = Vec::new();
    let mut keys_used = Vec::new();

    for (key, value) in properties {
        if available_keys.contains_key(key) {
            let node = available_keys.get(key).unwrap();
            validations.push(validate.validate_root(node.walk(), value));
            keys_used.push(key.to_owned());
        }
    }

    Some(Properties {
        keys_used,
        validation: validations,
    })
}
