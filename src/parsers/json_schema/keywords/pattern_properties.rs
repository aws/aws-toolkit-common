use std::collections::HashMap;

use regex::Regex;
use serde_json::Value;
use tree_sitter::Node;

use crate::parsers::json_schema::{
    json_schema_parser::JSONSchemaValidator, utils::object::Properties,
};

pub fn validate_pattern_properties<'a>(
    validate: &'a JSONSchemaValidator,
    available_keys: &HashMap<&'a str, Node>,
    sub_schema: &'a Value,
) -> Option<Properties<'a>> {
    let properties = sub_schema.get("patternProperties")?.as_object()?;

    let mut validations = Vec::new();
    let mut keys_used = Vec::new();

    for (regex, schema) in properties {
        let property_regex = Regex::new(regex);

        if let Ok(reg) = property_regex {
            for (property, node) in available_keys {
                if reg.is_match(property) {
                    validations.push(validate.validate_root(node.walk(), schema));
                    keys_used.push(property.to_owned());
                }
            }
        }
    }

    Some(Properties {
        keys_used,
        validation: validations,
    })
}
