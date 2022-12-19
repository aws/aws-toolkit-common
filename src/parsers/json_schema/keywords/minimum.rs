use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}, errors::minimum_error}};

pub fn validate_minimum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let minimum_property = sub_schema.get("minimum");
    if minimum_property.is_none() {
        return None;
    }

    let minimum_value_option = get_number(JsonNumbers::Value(minimum_property.unwrap()));
    if minimum_value_option.is_none() {
        return None;
    }

    let minimum_value = minimum_value_option.unwrap();

    let sub = sub_schema.get("exclusiveMinimum");

    match sub {
        Some(Value::Bool(boo)) => {
            if boo == &true && node.value <= minimum_value_option.unwrap() {
                return Some(to_diagnostic(node.start, node.end, minimum_error(node.value, minimum_value)));
            }
            if boo == &false && node.value < minimum_value_option.unwrap() {
                return Some(to_diagnostic(node.start, node.end, minimum_error(node.value, minimum_value)));
            }
            return None;
        },
        Some(Value::Number(num)) => {
            let smallest_minimum = min(minimum_value, get_number(JsonNumbers::Number(num)));
        
            if node.value < smallest_minimum {
                return Some(to_diagnostic(node.start, node.end, minimum_error(node.value, smallest_minimum)));
            }
            return None;
        },
        _ => {
            if node.value < minimum_value {
                return Some(to_diagnostic(node.start, node.end, format!("Value !{:#?} was above the maximum of !{:#?}", node.value, minimum_value)));
            }
            return None;
        }
    }
}

fn min(minimum_value: f64, exclusive_minimum_value: Option<f64>) -> f64 {
    if exclusive_minimum_value.is_some() {
        let emin_val = exclusive_minimum_value.unwrap();
        if minimum_value > emin_val {
            return minimum_value;
        }
        return emin_val;
    }
    return minimum_value;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::IRNumber};

//     use super::{validate_minimum, min};

//     #[test]
//     fn max_items_ok() {
//         let schema = &json!({
//             "minimum": 5
//         });
//         let result = validate_minimum(&IRNumber::new(
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
//             "minimum": 5
//         });
//         let result = validate_minimum(&IRNumber::new(
//             5.0,
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
//             "minimum": 100,
//             "exclusiveMinimum": 75
//         });
//         let result = validate_minimum(&IRNumber::new(
//             85.0,
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
//             "minimum": 200
//         });
//         let result = validate_minimum(&IRNumber::new(
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
//             "notMinimum": 2
//         });
//         let result = validate_minimum(&IRNumber::new(
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
//             "minimum": "NAN"
//         });
//         let result = validate_minimum(&IRNumber::new(
//             200.0,
//             Position::new(0, 0),
//             Position::new(0, 4)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn min_ok_with_exclusive_min() {
//         let result = min(100.0, Some(125.0));
//         assert_eq!(result, 100.0)
//     }

// }
