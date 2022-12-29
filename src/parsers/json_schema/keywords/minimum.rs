use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::json_schema::{
        errors::minimum_error,
        utils::{
            ir::to_diagnostic,
            num::{get_number, JsonNumbers},
        },
    },
    utils::tree_sitter::IRNumber,
};

pub fn validate_minimum(node: &IRNumber, sub_schema: &Value) -> Option<Diagnostic> {
    let minimum_property = sub_schema.get("minimum")?;
    let expected_minimum = get_number(&JsonNumbers::Value(minimum_property))?;

    let exclusive_minimum = sub_schema.get("exclusiveMinimum");

    match exclusive_minimum {
        Some(Value::Bool(boo)) => {
            if boo == &true && node.value <= expected_minimum {
                return Some(to_diagnostic(
                    node.start,
                    node.end,
                    minimum_error(expected_minimum, node.value),
                ));
            }
            if boo == &false && node.value < expected_minimum {
                return Some(to_diagnostic(
                    node.start,
                    node.end,
                    minimum_error(expected_minimum, node.value),
                ));
            }
            None
        }
        Some(Value::Number(num)) => {
            let smallest_minimum = min(expected_minimum, get_number(&JsonNumbers::Number(num)));

            if node.value < smallest_minimum {
                return Some(to_diagnostic(
                    node.start,
                    node.end,
                    minimum_error(smallest_minimum, node.value),
                ));
            }
            None
        }
        _ => {
            if node.value < expected_minimum {
                return Some(to_diagnostic(
                    node.start,
                    node.end,
                    minimum_error(expected_minimum, node.value),
                ));
            }
            None
        }
    }
}

fn min(minimum_value: f64, exclusive_minimum_value: Option<f64>) -> f64 {
    if let Some(emin) = exclusive_minimum_value {
        if minimum_value < emin {
            return minimum_value;
        }
        return emin;
    }
    minimum_value
}
