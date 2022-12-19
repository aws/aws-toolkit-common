use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}, errors::multiple_of_error}};

pub fn validate_multiple_of(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let multiple_of_property = sub_schema.get("multipleOf")?;
    let multiple_of_value = get_number(JsonNumbers::Value(multiple_of_property))?;

    if node.value % multiple_of_value != 0.0 {
        return Some(to_diagnostic(node.start, node.end, multiple_of_error(node.value, multiple_of_value)));
    }

    return None;
}
