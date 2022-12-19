use itertools::Itertools;
use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use crate::{parsers::{json_schema::{utils::{matches_type, to_diagnostic}, errors::type_error}, ir::IR}};

pub fn validate_type(ir_node: &IR, sub_schema: &Value) -> Option<Diagnostic> {
    let type_property = sub_schema.get("type");
    if type_property.is_none() {
        return None;
    }

    let start = ir_node.clone().get_start();
    let end = ir_node.clone().get_end();
    let kind = ir_node.clone().get_kind();

    let types_arr = type_property.unwrap().as_array();
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
        let types = type_property.unwrap().as_str();
        if types.is_some() && !matches_type(ir_node, types.unwrap()) {
            return Some(to_diagnostic(start, end, type_error(kind, types.unwrap().to_string())));
        }
    }

    return None;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::{IRString, NodeTypes}};

//     use super::validate_type;

//     #[test]
//     fn type_ok() {
//         let schema = &json!({
//             "type": "string"
//         });
//         let result = validate_type(&NodeTypes::IRString(IRString::new(
//             String::from("name"),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         )),
//             schema
//         );

//         assert!(result.is_none())
//     }

//     #[test]
//     fn type_ok_array() {
//         let schema = &json!({
//             "type": ["boolean", "string"]
//         });
//         let result = validate_type(&NodeTypes::IRString(IRString::new(
//             String::from("name"),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         )),
//             schema
//         );

//         assert!(result.is_none())
//     }

//     #[test]
//     fn type_error() {
//         let schema = &json!({
//             "type": ["boolean"]
//         });
//         let result = validate_type(&NodeTypes::IRString(IRString::new(
//             String::from("name"),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         )),
//             schema
//         );

//         // TODO make this test more robust
//         assert!(result.is_some())
//     }
    
//     #[test]
//     fn type_not_found() {
//         let schema = &json!({
//             "notType": ["boolean"]
//         });
//         let result = validate_type(&NodeTypes::IRString(IRString::new(
//             String::from("name"),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         )),
//             schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn type_not_array_or_string() {
//         let schema = &json!({
//             "type": false
//         });
//         let result = validate_type(&NodeTypes::IRString(IRString::new(
//             String::from("name"),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         )),
//             schema
//         );
//         assert!(result.is_none())
//     }
// }
