use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}, errors::minimum_error}};

pub fn validate_minimum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let minimum_property = sub_schema.get("minimum")?;
    let expected_minimum = get_number(JsonNumbers::Value(minimum_property))?;

    let exclusive_minimum = sub_schema.get("exclusiveMinimum");

    match exclusive_minimum {
        Some(Value::Bool(boo)) => {
            if boo == &true && node.value <= expected_minimum {
                return Some(to_diagnostic(node.start, node.end, minimum_error(expected_minimum, node.value)));
            }
            if boo == &false && node.value < expected_minimum {
                return Some(to_diagnostic(node.start, node.end, minimum_error(expected_minimum, node.value)));
            }
            return None;
        },
        Some(Value::Number(num)) => {
            let smallest_minimum = min(expected_minimum, get_number(JsonNumbers::Number(num)));
        
            if node.value < smallest_minimum {
                return Some(to_diagnostic(node.start, node.end, minimum_error(smallest_minimum, node.value)));
            }
            return None;
        },
        _ => {
            if node.value < expected_minimum {
                return Some(to_diagnostic(node.start, node.end, minimum_error(expected_minimum, node.value)));
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
