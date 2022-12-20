use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}, errors::exclusive_maximum_error}};

pub fn validate_exclusive_maximum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let exclusive_maximum_property = sub_schema.get("exclusiveMaximum")?;
    let expected_maximum = get_number(JsonNumbers::Value(exclusive_maximum_property))?;

    if node.value >= expected_maximum {
        return Some(to_diagnostic(node.start, node.end, exclusive_maximum_error(expected_maximum, node.value)));
    }

    return None;
}
