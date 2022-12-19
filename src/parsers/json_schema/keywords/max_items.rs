use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRArray}, parsers::json_schema::{utils::to_diagnostic, errors::expected_items_error}};

pub fn validate_max_items(node: &IRArray, sub_schema: &Value) -> Option<Diagnostic> {
    let max_items = sub_schema.get("maxItems")?.as_i64()?.try_into().ok()?;
    let items_length = node.items.len();

    if items_length > max_items {
        return Some(to_diagnostic(node.start, node.end, expected_items_error(items_length, max_items)));
    }

    return None;
}
