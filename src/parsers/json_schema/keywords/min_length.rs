use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::json_schema::{errors::expected_length_error, utils::to_diagnostic},
    utils::tree_sitter::IRString,
};

pub fn validate_min_length(node: &IRString, sub_schema: &Value) -> Option<Diagnostic> {
    let expected_length = sub_schema.get("minLength")?.as_i64()?.try_into().ok()?;
    let found_length = node.contents.len();

    if found_length < expected_length {
        return Some(to_diagnostic(
            node.start,
            node.end,
            expected_length_error(expected_length, found_length),
        ));
    }

    return None;
}
