use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::json_schema::{
        errors::maximum_error,
        utils::{
            ir::to_diagnostic,
            num::{get_number, JsonNumbers},
        },
    },
    utils::tree_sitter::IRNumber,
};

pub fn validate_maximum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let maximum_property = sub_schema.get("maximum")?;
    let expected_maximum = get_number(JsonNumbers::Value(maximum_property))?;

    let exclusive_maximum = sub_schema.get("exclusiveMaximum");

    match exclusive_maximum {
        Some(Value::Bool(boo)) => {
            if boo == &true && node.value >= expected_maximum {
                return Some(to_diagnostic(
                    node.start,
                    node.end,
                    maximum_error(expected_maximum, node.value),
                ));
            }
            if boo == &false && node.value > expected_maximum {
                return Some(to_diagnostic(
                    node.start,
                    node.end,
                    maximum_error(expected_maximum, node.value),
                ));
            }
            None
        }
        Some(Value::Number(num)) => {
            let largest_maximum = max(expected_maximum, get_number(JsonNumbers::Number(num)));

            if node.value > largest_maximum {
                return Some(to_diagnostic(
                    node.start,
                    node.end,
                    maximum_error(largest_maximum, node.value),
                ));
            }
            None
        }
        _ => {
            if node.value > expected_maximum {
                return Some(to_diagnostic(
                    node.start,
                    node.end,
                    maximum_error(expected_maximum, node.value),
                ));
            }
            None
        }
    }
}

fn max(maximum_value: f64, exclusive_maximum_value: Option<f64>) -> f64 {
    if let Some(emax) = exclusive_maximum_value {
        if maximum_value > emax {
            return maximum_value;
        }
        return emax;
    }
    maximum_value
}
