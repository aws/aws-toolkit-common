use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRString}, parsers::json_schema::{utils::to_diagnostic, errors::expected_items_error}};

pub fn validate_max_length(node: &IRString, sub_schema: &Value) -> Option<Diagnostic> {
    let max_length = sub_schema.get("maxLength")?.as_i64()?.try_into().ok()?;
    let content_length = node.contents.len();

    if content_length > max_length {
        return Some(to_diagnostic(node.start, node.end, expected_items_error(content_length, max_length)));
    }

    return None;
}
