use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::parsers::{json_schema::{utils::{to_diagnostic, is_equal2}}, ir::IR};

pub fn validate_enum(node: &IR, file_contents: &String, sub_schema: &Value) -> Option<Diagnostic> {
    let enum_value = sub_schema.get("enum")?.as_array()?;

    let mut found_match = false;
    for e in enum_value {
        if is_equal2(node, file_contents, e) {
            found_match = true;
        }
    }

    if !found_match {
        // TODO anti-pattern, we shouldn't be using clone here
        return Some(to_diagnostic(node.clone().get_start(), node.clone().get_end(), format!("Enum error message was above the exclusive maximum of ")));
    }

    return None;
}
