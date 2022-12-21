use std::collections::HashMap;

use serde_json::{json, Value};
use tree_sitter::Node;

use crate::{
    parsers::json_schema::{
        errors::additional_properties_error,
        json_schema_parser::{Validate, Validation},
        utils::ir::to_diagnostic,
    },
    utils::tree_sitter::{end_position, start_position},
};

pub fn validate_additional_properties(
    validate: &Validate,
    available_keys: &mut HashMap<String, Node>,
    sub_schema: &Value,
) -> Option<Vec<Validation>> {
    let properties = sub_schema.get("additionalProperties")?;

    let mut validations: Vec<Validation> = Vec::new();
    match properties {
        Value::Bool(boo) => {
            if boo == &true {
                // re-evaluate all the property nodes that haven't been visited yet against the schema

                // TODO using clone here is probably an anti-pattern, but we need to remove processed properties. Theoretically we could return Vec<processed properties> in addition to diagnostics
                // and then remove them from the json_schema parser
                for (key, value) in available_keys.clone() {
                    available_keys.remove(&key);
                    validations.push(validate.validate_root(value.walk(), sub_schema));
                }
            } else {
                let mut validation = Validation::new();
                // properties/patternProperties have already removed all their matching nodes, these errors shouldn't be here
                for (additional_property, value) in available_keys.clone() {
                    available_keys.remove(&additional_property);
                    validation.errors.push(to_diagnostic(
                        start_position(value),
                        end_position(value),
                        additional_properties_error(additional_property),
                    ));
                }
                validations.push(validation);
            }

            Some(validations)
        }
        Value::Object(obj) => {
            // TODO using clone here is probably an anti-pattern, but we need to remove processed properties. Theoretically we could return Vec<processed properties> in addition to diagnostics
            // and then remove them from the json_schema parser
            for (key, value) in available_keys.clone() {
                available_keys.remove(&key);
                validations.push(validate.validate_root(value.walk(), &json!(obj)));
            }

            Some(validations)
        }
        _ => Some(validations),
    }
}
