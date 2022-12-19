use std::collections::HashSet;

use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRArray, parsers::{json_schema::{utils::{to_diagnostic, get_value}, errors::unique_items_error}, ir::IR}};

pub fn validate_unique_items(node: &IRArray, file_contents: &String, sub_schema: &Value) -> Option<Vec<Diagnostic>> {
    let unique_items_property = sub_schema.get("uniqueItems");
    if unique_items_property.is_none() {
        return None;
    }

    let unique_items_value = unique_items_property.unwrap().as_bool();
    if unique_items_value.is_none() || unique_items_value.unwrap() == false {
        return None;
    }

    let mut duplicate_items = HashSet::new();
    let mut found_items = HashSet::new();

    for item in &node.items {
        let ir_node = IR::new(item.to_owned(), file_contents.to_string());
        if ir_node.is_none() {
            continue;
        }
        
        let val = get_value(ir_node.unwrap(), file_contents);
        if found_items.contains(&val) {
            duplicate_items.insert(item);
        }

        found_items.insert(val);
    }

    if !duplicate_items.is_empty() {
        let mut errors = Vec::new();

        for item in duplicate_items {
            // TODO make safe, unwrap shouldn't be there
            errors.push(to_diagnostic(node.start, node.end, unique_items_error(item.utf8_text(file_contents.as_bytes()).unwrap().to_string())))
        }

        return Some(errors);
    }

    return None;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::{IRArray, NodeTypes, IRString}};

//     use super::validate_unique_items;

//     #[test]
//     fn unique_items_ok_true() {
//         let schema = json!({
//             "uniqueItems": true
//         });
//         let result = validate_unique_items(&IRArray::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn unique_items_ok_false() {
//         let schema = json!({
//             "uniqueItems": false
//         });
//         let result = validate_unique_items(&IRArray::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn unique_items_error() {
//         let schema = json!({
//             "uniqueItems": true
//         });
//         let result = validate_unique_items(&IRArray::new(
//             vec![
//                 NodeTypes::IRString(IRString::new(
//                     String::from("test"),
//                     Position::new(0, 0),
//                     Position::new(0, 4)
//                 )),
//                 NodeTypes::IRString(IRString::new(
//                     String::from("test"),
//                     Position::new(0, 0),
//                     Position::new(0, 4)
//                 ))
//             ],
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );

//         // TODO make this test more robust
//         assert!(result.is_some())
//     }
    
//     #[test]
//     fn unique_items_not_found() {
//         let schema = json!({
//             "notUniqueItems": true
//         });
//         let result = validate_unique_items(&IRArray::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn unique_items_not_boolean() {
//         let schema = json!({
//             "uniqueItems": "NAN"
//         });
//         let result = validate_unique_items(&IRArray::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }
// }
