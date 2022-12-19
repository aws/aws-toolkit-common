use std::collections::HashSet;

use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use itertools::Itertools;
use crate::{utils::tree_sitter::IRObject, parsers::json_schema::{utils::to_diagnostic, errors::required_error}};

pub fn validate_required(node: &IRObject, sub_schema: &Value) -> Option<Diagnostic> {
    let required = sub_schema.get("required")?.as_array()?;

    // get the hashset of all the requirements
    let mut requirements_hash = HashSet::new();
    for req in required {
        let potential_requirement = req.as_str();
        if potential_requirement.is_some() {
            requirements_hash.insert(potential_requirement.unwrap());
        }
    }

    // ensure that every requirement is in the properties
    for prop in &node.properties {
        let property = prop.key.contents.as_str();

        if requirements_hash.contains(property) {
            requirements_hash.remove(property);
        }
    }

    if !requirements_hash.is_empty() {
        let missing_requirements = requirements_hash.into_iter().collect::<Vec<&str>>().iter().join(", ");
        return Some(to_diagnostic(node.start, node.end, required_error(missing_requirements)));
    }

    return None;
}
