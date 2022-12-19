use itertools::Itertools;
use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use crate::{parsers::{json_schema::{utils::{matches_type, to_diagnostic}, errors::type_error}, ir::IR}};

pub fn validate_type(ir_node: &IR, sub_schema: &Value) -> Option<Diagnostic> {
    let type_property = sub_schema.get("type")?;

    let start = ir_node.clone().get_start();
    let end = ir_node.clone().get_end();
    let kind = ir_node.clone().get_kind();

    let types_arr = type_property.as_array();
    if types_arr.is_some() {
        let mut type_found = false;
        for types in types_arr.unwrap() {
            let json_type = types.as_str();
            if json_type.is_some() && matches_type(ir_node, json_type.unwrap()) {
                type_found = true;
            }
        }

        if !type_found {
            let missing_types = types_arr.unwrap().iter().filter(|f| f.as_str().is_some()).map(|f| f.as_str().unwrap()).join(", ");
            return Some(to_diagnostic(start, end, type_error(kind, missing_types)));
        }
    } else {
        let types = type_property.as_str()?;
        if !matches_type(ir_node, types) {
            return Some(to_diagnostic(start, end, type_error(kind, types.to_string())));
        }
    }

    return None;
}
