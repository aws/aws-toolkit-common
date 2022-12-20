use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::json_schema::{errors::expected_items_error, utils::to_diagnostic},
    utils::tree_sitter::IRArray,
};

pub fn validate_min_items(node: &IRArray, sub_schema: &Value) -> Option<Diagnostic> {
    let expected_items = sub_schema.get("minItems")?.as_i64()?.try_into().ok()?;
    let found_items = node.items.len();

    if found_items < expected_items {
        return Some(to_diagnostic(
            node.start,
            node.end,
            expected_items_error(expected_items, found_items),
        ));
    }

    return None;
}
