use std::collections::HashMap;

use serde_json::Value;
use tree_sitter::Node;

use crate::parsers::json_schema::json_schema_parser::{Validate, Validation};

pub fn validate_properties(
    validate: &Validate,
    available_keys: &mut HashMap<String, Node>,
    sub_schema: &Value,
) -> Option<Vec<Validation>> {
    let properties = sub_schema.get("properties")?.as_object()?;

    let mut validations: Vec<Validation> = Vec::new();
    for (key, value) in properties {
        if available_keys.contains_key(key) {
            let node = available_keys.get(key).unwrap();
            validations.push(validate.validate_root(node.walk(), value));
            available_keys.remove(key);
        }
    }

    Some(validations)
}
