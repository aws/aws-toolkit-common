use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRArray}, parsers::json_schema::{utils::to_diagnostic, errors::expected_items_error}};

pub fn validate_max_items(node: &IRArray, sub_schema: &Value) -> Option<Diagnostic> {
    let max_items_property = sub_schema.get("maxItems");
    if max_items_property.is_none() {
        return None;
    }

    let max_items_value = max_items_property.unwrap().as_i64();
    if max_items_value.is_none() {
        return None;
    }

    let items_length = node.items.len();
    let max_items = max_items_value.unwrap().try_into();

    if max_items.is_ok() && items_length > max_items.unwrap() {
        return Some(to_diagnostic(node.start, node.end, expected_items_error(items_length, max_items.unwrap())));
    }

    return None;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::{IRArray, IRString, NodeTypes}};

//     use super::validate_max_items;

//     #[test]
//     fn max_items_ok() {
//         let schema = &json!({
//             "maxItems": 0
//         });
//         let result = validate_max_items(&IRArray::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn max_items_error() {
//         let schema = &json!({
//             "maxItems": 1
//         });
//         let result = validate_max_items(&IRArray::new(
//             vec![NodeTypes::IRString(IRString::new(
//                 String::from("test"),
//                 Position::new(0, 0),
//                 Position::new(0, 4)
//             )),
//             NodeTypes::IRString(IRString::new(
//                 String::from("test"),
//                 Position::new(0, 0),
//                 Position::new(0, 4)
//             ))],
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );

//         // TODO make this test more robust
//         assert!(result.is_some())
//     }
    
//     #[test]
//     fn max_items_not_found() {
//         let schema = &json!({
//             "notMaxItems": 2
//         });
//         let result = validate_max_items(&IRArray::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn max_items_not_number() {
//         let schema = &json!({
//             "maxItems": "NAN"
//         });
//         let result = validate_max_items(&IRArray::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }
// }
