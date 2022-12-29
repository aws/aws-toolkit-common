use crate::parsers::{
    ir::IR,
    json_schema::{
        errors::type_error,
        utils::ir::{matches_type, to_diagnostic},
    },
};
use itertools::Itertools;
use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

pub fn validate_type(ir_node: &IR, sub_schema: &Value) -> Option<Diagnostic> {
    let type_property = sub_schema.get("type")?;

    let start = ir_node.clone().get_start();
    let end = ir_node.clone().get_end();
    let kind = ir_node.clone().get_kind();

    if let Some(types) = type_property.as_array() {
        let mut type_found = false;
        for types in types {
            let json_type = types.as_str();
            if json_type.is_some() && matches_type(ir_node, json_type.unwrap()) {
                type_found = true;
            }
        }

        if !type_found {
            // Get all the possible types
            let missing_types = types
                .iter()
                .filter(|f| f.as_str().is_some())
                .map(|f| f.as_str().unwrap())
                .join(", ");
            return Some(to_diagnostic(start, end, type_error(&missing_types, kind)));
        }
    } else {
        let types = type_property.as_str()?;
        if !matches_type(ir_node, types) {
            return Some(to_diagnostic(start, end, type_error(types, kind)));
        }
    }
    None
}
