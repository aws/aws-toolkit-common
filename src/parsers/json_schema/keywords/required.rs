use std::collections::HashSet;

use crate::{
    parsers::json_schema::{errors::required_error, utils::ir::to_diagnostic},
    utils::tree_sitter::IRObject,
};
use itertools::Itertools;
use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

pub fn validate_required(node: &IRObject, sub_schema: &Value) -> Option<Diagnostic> {
    let required = sub_schema.get("required")?.as_array()?;

    // get the hashset of all the requirements
    let mut requirements_hash = HashSet::new();
    for req in required {
        if let Some(requirement) = req.as_str() {
            requirements_hash.insert(requirement);
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
        let missing_requirements = requirements_hash
            .into_iter()
            .collect::<Vec<&str>>()
            .iter()
            .sorted()
            .join(", ");
        return Some(to_diagnostic(
            node.start,
            node.end,
            required_error(missing_requirements),
        ));
    }

    None
}
