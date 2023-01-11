use serde_json::Value;
use tower_lsp::lsp_types::{Diagnostic, NumberOrString};

use crate::parsers::{
    ir::IR,
    json_schema::{
        errors::enum_error,
        utils::ir::{get_value, is_equal, to_diagnostic},
    },
};

// TODO eventually extract this out so other backends can have use code action
pub const ENUM_CODE: &str = "ENUM_ACTION";

pub fn validate_enum(node: &IR, file_contents: &str, sub_schema: &Value) -> Option<Diagnostic> {
    let enums = sub_schema.get("enum")?.as_array()?;

    let mut found_match = false;
    let mut enum_options = Vec::new();
    for e in enums {
        if is_equal(node, file_contents, e) {
            found_match = true;
        }

        enum_options.push(e.to_string());
    }

    if !found_match {
        let value = get_value(node, file_contents);
        let mut diag = to_diagnostic(
            node.get_start(),
            node.get_end(),
            enum_error(&enum_options, format!("{:#?}", value)),
        );
        if enum_options.len() == 1 {
            diag.code = Some(NumberOrString::String(ENUM_CODE.to_string()));
        }
        return Some(diag);
    }

    None
}
