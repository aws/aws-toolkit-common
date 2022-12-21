use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::json_schema::{
        errors::multiple_of_error,
        utils::{
            ir::to_diagnostic,
            num::{get_number, JsonNumbers},
        },
    },
    utils::tree_sitter::IRNumber,
};

pub fn validate_multiple_of(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let multiple_of_property = sub_schema.get("multipleOf")?;
    let expected_multiple_of = get_number(JsonNumbers::Value(multiple_of_property))?;

    if node.value % expected_multiple_of != 0.0 {
        return Some(to_diagnostic(
            node.start,
            node.end,
            multiple_of_error(expected_multiple_of, node.value),
        ));
    }

    None
}
