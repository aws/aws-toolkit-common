use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::json_schema::{
        errors::exclusive_minimum_error,
        utils::{ir::to_diagnostic, num::JsonNumbers},
    },
    utils::tree_sitter::IRNumber,
};

pub fn validate_exclusive_minimum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let exclusive_minimum_property = sub_schema.get("exclusiveMinimum")?;
    let expected_minimum = JsonNumbers::Value(exclusive_minimum_property).get_number()?;

    if node.value <= expected_minimum {
        return Some(to_diagnostic(
            node.start,
            node.end,
            exclusive_minimum_error(expected_minimum, node.value),
        ));
    }

    None
}
