use std::collections::HashMap;

use serde_json::Value;
use tree_sitter::Node;

use crate::parsers::{
    json_schema::{json_schema_parser::JSONSchemaValidator, utils::object::Properties},
    parser::ParseResult,
};

pub fn validate_properties<'a>(
    validate: &'a JSONSchemaValidator,
    available_keys: &HashMap<&'a str, Node>,
    sub_schema: &'a Value,
    contents: &String,
) -> Option<Properties<'a>> {
    let properties = sub_schema.get("properties")?.as_object()?;

    let mut validations: Vec<ParseResult> = Vec::new();
    let mut keys_used = Vec::new();

    for (key, value) in properties {
        if available_keys.contains_key(key.as_str()) {
            let node = available_keys.get(key.as_str()).unwrap();
            validations.push(validate.validate_root(node.walk(), value, contents));
            keys_used.push(key.as_str());
        }
    }

    Some(Properties {
        keys_used,
        validation: validations,
    })
}
