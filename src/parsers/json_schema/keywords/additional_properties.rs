use std::collections::HashMap;

use serde_json::{Value, json};
use tower_lsp::lsp_types::Diagnostic;
use tree_sitter::Node;

use crate::{parsers::json_schema::{json_schema_parser::Validate, utils::to_diagnostic}, utils::tree_sitter::{start_position, end_position}};

pub fn validate_additional_properties(validate: &Validate, available_keys: &mut HashMap<String, Node>, sub_schema: &Value) -> Option<Vec<Diagnostic>> {
    let properties_property = sub_schema.get("additionalProperties");
    if properties_property.is_none() {
        return None;
    }

    let mut errors: Vec<Diagnostic> = Vec::new();
    match properties_property {
        Some(Value::Bool(boo)) => {
            if boo == &true {
                // re-evaluate all the property nodes that haven't been visited yet against the schema

                // TODO using clone here is probably an anti-pattern, but we need to remove processed properties. Theoretically we could return Vec<processed properties> in addition to diagnostics
                // and then remove them from the json_schema parser
                for (key, value) in available_keys.clone() {
                    available_keys.remove(&key);
                    errors.extend(validate.validate_root(value.walk(), sub_schema));
                }

            } else {
                // properties/patternProperties have already removed all their matching nodes, these errors shouldn't be here
                for (key, value) in available_keys.clone() {
                    available_keys.remove(&key);
                    errors.push(to_diagnostic(start_position(value), end_position(value), format!("!{:#?} was declared but shouldn't be", key)));
                }    
            }

            return Some(errors);
        },
        Some(Value::Object(obj)) => {
            // TODO using clone here is probably an anti-pattern, but we need to remove processed properties. Theoretically we could return Vec<processed properties> in addition to diagnostics
            // and then remove them from the json_schema parser
            for (key, value) in available_keys.clone() {
                available_keys.remove(&key);
                errors.extend(validate.validate_root(value.walk(), &json!(obj)));
            }

            return Some(errors);
        },
        _ => {
            return Some(errors);
        }
    }    
}
