use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}, errors::multiple_of_error}};

pub fn validate_multiple_of(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let multiple_of_property = sub_schema.get("multipleOf")?;
    let multiple_of_value = get_number(JsonNumbers::Value(multiple_of_property))?;

    if node.value % multiple_of_value != 0.0 {
        return Some(to_diagnostic(node.start, node.end, multiple_of_error(node.value, multiple_of_value)));
    }

    return None;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::IRNumber};

//     use super::validate_multiple_of;

//     #[test]
//     fn multiple_of_ok_int() {
//         let schema = &json!({
//             "multipleOf": 5
//         });
//         let result = validate_multiple_of(&IRNumber::new(
//             5.0, 
//             Position::new(0, 0),
//             Position::new(0, 1)),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     // TODO
//     // fn multiple_of_ok_float() {
//     //     let schema = json!({
//     //         "multipleOf": 5.0
//     //     });
//     //     let result = validate_multiple_of(&IRNumber::new(
//     //         5.0, 
//     //         Position::new(0, 0),
//     //         Position::new(0, 1)),
//     //     schema
//     //     );
//     //     assert!(result.is_none())
//     // }

//     #[test]
//     fn multiple_of_error() {
//         let schema = &json!({
//             "multipleOf": 5
//         });
//         let result = validate_multiple_of(&IRNumber::new(
//             7.0, 
//             Position::new(0, 0),
//             Position::new(0, 1)),
//         schema
//         );

//         // TODO make this test more robust
//         assert!(result.is_some())
//     }
    
//     #[test]
//     fn multiple_of_not_found() {
//         let schema = &json!({
//             "notMultipleOf": 5
//         });
//         let result = validate_multiple_of(&IRNumber::new(
//             7.0, 
//             Position::new(0, 0),
//             Position::new(0, 1)),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn multiple_of_not_number() {
//         let schema = &json!({
//             "multipleOf": "NAN"
//         });
//         let result = validate_multiple_of(&IRNumber::new(
//             7.0,
//             Position::new(0, 0),
//             Position::new(0, 1)),
//         schema
//         );
//         assert!(result.is_none())
//     }
// }
