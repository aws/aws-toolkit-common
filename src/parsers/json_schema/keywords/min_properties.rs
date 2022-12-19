use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRObject}, parsers::json_schema::{utils::to_diagnostic, errors::expected_properties_error}};

pub fn validate_min_properties(node: &IRObject, sub_schema: &Value) -> Option<Diagnostic> {
    let min_properties = sub_schema.get("minProperties")?.as_i64()?.try_into().ok()?;
    let properties_length = node.properties.len();

    if properties_length < min_properties {
        return Some(to_diagnostic(node.start, node.end, expected_properties_error(properties_length, min_properties)));
    }

    return None;
}
