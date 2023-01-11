use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::json_schema::{errors::expected_properties_error, utils::ir::to_diagnostic},
    utils::tree_sitter::IRObject,
};

pub fn validate_min_properties(node: &IRObject, sub_schema: &Value) -> Option<Diagnostic> {
    let expected_properties = sub_schema.get("minProperties")?.as_i64()?.try_into().ok()?;
    let found_properties = node.properties.len();

    if found_properties < expected_properties {
        return Some(to_diagnostic(
            node.start,
            node.end,
            expected_properties_error(expected_properties, found_properties),
        ));
    }

    None
}
