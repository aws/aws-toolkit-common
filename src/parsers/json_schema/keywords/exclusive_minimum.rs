use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}}};

pub fn validate_exclusive_minimum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let exclusive_minimum_property = sub_schema.get("exclusiveMinimum");
    if exclusive_minimum_property.is_none() {
        return None;
    }

    let exclusive_minimum_value = get_number(JsonNumbers::Value(exclusive_minimum_property.unwrap()));
    if exclusive_minimum_value.is_none() {
        return None;
    }

    if node.value <= exclusive_minimum_value.unwrap() {
        return Some(to_diagnostic(node.start, node.end, format!("Value !{:#?} was above the exclusive minimum of !{:#?}", node.value, exclusive_minimum_value.unwrap())));
    }

    return None;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::IRNumber};

//     use super::validate_exclusive_minimum;

//     #[test]
//     fn max_items_ok() {
//         let schema = &json!({
//             "exclusiveMinimum": 5
//         });
//         let result = validate_exclusive_minimum(&IRNumber::new(
//             100.0,
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
//             "exclusiveMinimum": 5
//         });
//         let result = validate_exclusive_minimum(&IRNumber::new(
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
//             "exclusiveMinimum": 200
//         });
//         let result = validate_exclusive_minimum(&IRNumber::new(
//             100.0,
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
//             "notExclusiveMinimum": 2
//         });
//         let result = validate_exclusive_minimum(&IRNumber::new(
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
//             "notExclusiveManimum": "NAN"
//         });
//         let result = validate_exclusive_minimum(&IRNumber::new(
//             200.0,
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }
// }
