use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRString}, parsers::json_schema::{utils::to_diagnostic, errors::expected_items_error}};

pub fn validate_min_length(node: &IRString, sub_schema: &Value) -> Option<Diagnostic> {
    let min_length = sub_schema.get("minLength")?.as_i64()?.try_into().ok()?;
    let content_length = node.contents.len();

    if content_length < min_length {
        return Some(to_diagnostic(node.start, node.end, expected_items_error(content_length, min_length)));
    }

    return None;
}
