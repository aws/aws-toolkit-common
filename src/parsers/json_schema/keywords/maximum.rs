use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}, errors::maximum_error}};

pub fn validate_maximum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let maximum_property = sub_schema.get("maximum");
    if maximum_property.is_none() {
        return None;
    }

    let maximum_value_option = get_number(JsonNumbers::Value(maximum_property.unwrap()));
    if maximum_value_option.is_none() {
        return None;
    }

    let maximum_value = maximum_value_option.unwrap();

    let sub = sub_schema.get("exclusiveMaximum");

    match sub {
        Some(Value::Bool(boo)) => {
            if boo == &true && node.value >= maximum_value_option.unwrap() {
                return Some(to_diagnostic(node.start, node.end, maximum_error(node.value, maximum_value)));
            }
            if boo == &false && node.value > maximum_value_option.unwrap() {
                return Some(to_diagnostic(node.start, node.end, maximum_error(node.value, maximum_value)));
            }
            return None;
        },
        Some(Value::Number(num)) => {
            let largest_maximum = max(maximum_value, get_number(JsonNumbers::Number(num)));
        
            if node.value > largest_maximum {
                return Some(to_diagnostic(node.start, node.end, maximum_error(node.value, largest_maximum)));
            }
            return None;
        },
        _ => {
            if node.value > maximum_value {
                return Some(to_diagnostic(node.start, node.end, maximum_error(node.value, maximum_value)));
            }
            return None;
        }
    }
}

fn max(maximum_value: f64, exclusive_maximum_value: Option<f64>) -> f64 {
    if exclusive_maximum_value.is_some() {
        let emax_val = exclusive_maximum_value.unwrap();
        if maximum_value > emax_val {
            return maximum_value;
        }
        return emax_val;
    }
    return maximum_value;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::IRNumber};

//     use super::{validate_maximum};

//     #[test]
//     fn max_items_ok() {
//         let schema = &json!({
//             "maximum": 100
//         });
//         let result = validate_maximum(&IRNumber::new(
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
//             "maximum": 100
//         });
//         let result = validate_maximum(&IRNumber::new(
//             100.0,
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn max_items_with_exclusive_max() {
//         let schema = &json!({
//             "maximum": 100,
//             "exclusiveMaximum": 150
//         });
//         let result = validate_maximum(&IRNumber::new(
//             125.0,
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
//             "maximum": 100
//         });
//         let result = validate_maximum(&IRNumber::new(
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
//             "notMaximum": 2
//         });
//         let result = validate_maximum(&IRNumber::new(
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
//             "maximum": "NAN"
//         });
//         let result = validate_maximum(&IRNumber::new(
//             200.0,
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     // #[test]
//     // fn max_ok_without_exclusive_max() {
//     //     let schema = &json!({
//     //     });
//     //     let result = max(100.0, Some(schema));
//     //     assert_eq!(result, 100.0)
//     // }

//     // #[test]
//     // fn max_ok_with_exclusive_max() {
//     //     let schema = &json!({
//     //         "exclusiveMaximum": 125
//     //     });
//     //     let result = max(100.0, schema.get("exclusiveMaximum"));
//     //     assert_eq!(result, 125.0)
//     // }

//     // #[test]
//     // fn max_ok_with_exclusive_max_non_existant_exclusive() {
//     //     let schema = &json!({
//     //         "exclusiveMaximum": "test"
//     //     });
//     //     let result = max(100.0, schema.get("exclusiveMaximum"));
//     //     assert_eq!(result, 100.0)
//     // }

// }
