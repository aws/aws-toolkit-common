use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}, errors::exclusive_minimum_error}};

pub fn validate_exclusive_minimum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let exclusive_minimum_property = sub_schema.get("exclusiveMinimum")?;
    let exclusive_minimum = get_number(JsonNumbers::Value(exclusive_minimum_property))?;

    if node.value <= exclusive_minimum {
        return Some(to_diagnostic(node.start, node.end, exclusive_minimum_error(node.value, exclusive_minimum)));
    }

    return None;
}
