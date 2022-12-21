use std::collections::{HashMap, HashSet};

use regex::Regex;
use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use tree_sitter::Node;

use crate::parsers::json_schema::json_schema_parser::Validate;

pub fn validate_pattern_properties(
    validate: &Validate,
    available_keys: &mut HashMap<String, Node>,
    sub_schema: &Value,
) -> Option<Vec<Diagnostic>> {
    let properties = sub_schema.get("patternProperties")?.as_object()?;

    let mut errors = Vec::new();
    let mut processing = HashSet::new();
    for (regex, schema) in properties {
        let property_regex = Regex::new(regex);

        if let Ok(reg) = property_regex {
            // TODO using clone here is probably an anti-pattern, but we need to remove processed properties. Theoretically we could return Vec<processed properties> in addition to diagnostics
            // and then remove them from the json_schema parser
            for (property, node) in available_keys.clone() {
                if reg.is_match(&property) {
                    errors.extend(validate.validate_root(node.walk(), schema));

                    processing.insert(property);
                }
            }
        }
    }

    for property in processing {
        available_keys.remove(&property);
    }

    Some(errors)
}
