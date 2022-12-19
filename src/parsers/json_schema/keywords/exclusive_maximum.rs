use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}, errors::exclusive_maximum_error}};

pub fn validate_exclusive_maximum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let exclusive_maximum_property = sub_schema.get("exclusiveMaximum")?;
    let exclusive_maximum = get_number(JsonNumbers::Value(exclusive_maximum_property))?;

    if node.value >= exclusive_maximum {
        return Some(to_diagnostic(node.start, node.end, exclusive_maximum_error(node.value, exclusive_maximum)));
    }

    return None;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::IRNumber};

//     use super::validate_exclusive_maximum;

//     #[test]
//     fn max_items_ok() {
//         let schema = &json!({
//             "exclusiveMaximum": 100
//         });
//         let result = validate_exclusive_maximum(&IRNumber::new(
//             5.0,
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn max_items_on_edge() {
//         let schema = &json!({
//             "exclusiveMaximum": 5
//         });
//         let result = validate_exclusive_maximum(&IRNumber::new(
//             5.0,
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_some())
//     }

//     #[test]
//     fn max_items_error() {
//         let schema = &json!({
//             "exclusiveMaximum": 100
//         });
//         let result = validate_exclusive_maximum(&IRNumber::new(
//             200.0,
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
//             "notExclusiveMaximum": 2
//         });
//         let result = validate_exclusive_maximum(&IRNumber::new(
//             200.0,
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
//             "notExclusiveMaximum": "NAN"
//         });
//         let result = validate_exclusive_maximum(&IRNumber::new(
//             200.0,
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }
// }
