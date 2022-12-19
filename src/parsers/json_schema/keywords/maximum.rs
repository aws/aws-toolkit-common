use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::IRNumber, parsers::json_schema::{utils::to_diagnostic, num_utils::{get_number, JsonNumbers}, errors::maximum_error}};

pub fn validate_maximum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let maximum_property = sub_schema.get("maximum")?;
    let maximum_value = get_number(JsonNumbers::Value(maximum_property))?;

    let exclusive_maximum = sub_schema.get("exclusiveMaximum");

    match exclusive_maximum {
        Some(Value::Bool(boo)) => {
            if boo == &true && node.value >= maximum_value {
                return Some(to_diagnostic(node.start, node.end, maximum_error(node.value, maximum_value)));
            }
            if boo == &false && node.value > maximum_value {
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
