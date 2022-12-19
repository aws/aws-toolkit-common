use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRArray}, parsers::json_schema::{utils::to_diagnostic, errors::expected_items_error}};

pub fn validate_min_items(node: &IRArray, sub_schema: &Value) -> Option<Diagnostic> {
    let min_items = sub_schema.get("minItems")?.as_i64()?.try_into().ok()?;
    let items_length = node.items.len();

    if items_length < min_items {
        return Some(to_diagnostic(node.start, node.end, expected_items_error(items_length, min_items)));
    }

    return None;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::{IRArray, IRString, NodeTypes}};

//     use super::validate_min_items;

//     #[test]
//     fn min_items_ok() {
//         let schema = &json!({
//             "minItems": 1
//         });
//         let result = validate_min_items(&IRArray::new(
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
//         assert!(result.is_none())
//     }

//     #[test]
//     fn min_items_error() {
//         let schema = &json!({
//             "minItems": 5
//         });
//         let result = validate_min_items(&IRArray::new(
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
//     fn min_items_not_found() {
//         let schema = &json!({
//             "notMinItems": 2
//         });
//         let result = validate_min_items(&IRArray::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn min_items_not_number() {
//         let schema = &json!({
//             "minItems": "NAN"
//         });
//         let result = validate_min_items(&IRArray::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }
// }
