use std::collections::HashMap;

use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use tree_sitter::Node;

use crate::parsers::json_schema::json_schema_parser::Validate;

pub fn validate_properties(
    validate: &Validate,
    available_keys: &mut HashMap<String, Node>,
    sub_schema: &Value,
) -> Option<Vec<Diagnostic>> {
    let properties = sub_schema.get("properties")?.as_object()?;

    let mut errors: Vec<Diagnostic> = Vec::new();
    for (key, value) in properties {
        if available_keys.contains_key(key) {
            let node = available_keys.get(key).unwrap();
            errors.extend(validate.validate_root(node.walk(), value));
            available_keys.remove(key);
        }
    }

    return Some(errors);
}
