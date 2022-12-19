use std::collections::HashMap;

use serde_json::{Value, json};
use tower_lsp::lsp_types::Diagnostic;
use tree_sitter::Node;

use crate::{parsers::json_schema::{json_schema_parser::Validate, utils::to_diagnostic, errors::additional_properties_error}, utils::tree_sitter::{start_position, end_position}};

pub fn validate_additional_properties(validate: &Validate, available_keys: &mut HashMap<String, Node>, sub_schema: &Value) -> Option<Vec<Diagnostic>> {
    let properties = sub_schema.get("additionalProperties")?;

    let mut errors: Vec<Diagnostic> = Vec::new();
    match properties {
        Value::Bool(boo) => {
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
                for (additional_property, value) in available_keys.clone() {
                    available_keys.remove(&additional_property);
                    errors.push(to_diagnostic(start_position(value), end_position(value), additional_properties_error(additional_property)));
                }    
            }

            return Some(errors);
        },
        Value::Object(obj) => {
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
