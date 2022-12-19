use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRObject}, parsers::json_schema::utils::to_diagnostic};

pub fn validate_min_properties(node: &IRObject, sub_schema: &Value) -> Option<Diagnostic> {
    let min_properties_property = sub_schema.get("minProperties");
    if min_properties_property.is_none() {
        return None;
    }

    let min_properties_value = min_properties_property.unwrap().as_i64();
    if min_properties_value.is_none() {
        return None;
    }

    let properties_length = node.properties.len();
    let min_properties = min_properties_value.unwrap().try_into();

    if min_properties.is_ok() && properties_length < min_properties.unwrap() {
        return Some(to_diagnostic(node.start, node.end, format!("Expected !{:#?} properties but found !{:#?}", properties_length, min_properties.unwrap())));
    }

    return None;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::{IRObject, IRString, NodeTypes, IRPair}};

//     use super::validate_min_properties;

//     #[test]
//     fn min_properties_ok() {
//         let schema = json!({
//             "minProperties": 0
//         });
//         let result = validate_min_properties(&IRObject::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn min_properties_error() {
//         let schema = json!({
//             "minProperties": 5
//         });
//         let result = validate_min_properties(&IRObject::new(
//             vec![
//                 IRPair::new(
//                     IRString::new(
//                         String::from("test"),
//                         Position::new(0, 0),
//                         Position::new(0, 4)
//                     ),
//                     NodeTypes::IRString(IRString::new(
//                         String::from("test"),
//                         Position::new(0, 4),
//                         Position::new(0, 8)
//                     )),
//                     Position::new(0, 0),
//                     Position::new(0, 8)
//                 )
//             ],
//             Position::new(0, 0),
//             Position::new(0, 8)
//         ),
//         schema
//         );

//         // TODO make this test more robust
//         assert!(result.is_some())
//     }
    
//     #[test]
//     fn min_properties_not_found() {
//         let schema = json!({
//             "notMinProperties": 2
//         });
//         let result = validate_min_properties(&IRObject::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn min_properties_not_number() {
//         let schema = json!({
//             "minProperties": "NAN"
//         });
//         let result = validate_min_properties(&IRObject::new(
//             Vec::new(),
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }
// }
