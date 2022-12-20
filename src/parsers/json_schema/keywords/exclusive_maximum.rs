use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::json_schema::{
        errors::exclusive_maximum_error,
        num_utils::{get_number, JsonNumbers},
        utils::to_diagnostic,
    },
    utils::tree_sitter::IRNumber,
};

pub fn validate_exclusive_maximum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let exclusive_maximum_property = sub_schema.get("exclusiveMaximum")?;
    let expected_maximum = get_number(JsonNumbers::Value(exclusive_maximum_property))?;

    if node.value >= expected_maximum {
        return Some(to_diagnostic(
            node.start,
            node.end,
            exclusive_maximum_error(expected_maximum, node.value),
        ));
    }

    return None;
}
