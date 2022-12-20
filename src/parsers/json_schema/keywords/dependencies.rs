use std::collections::HashMap;

use itertools::Itertools;
use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use tree_sitter::Node;

use crate::{
    parsers::json_schema::utils::{new_schema_ref, to_diagnostic},
    utils::tree_sitter::{end_position, start_position},
};

pub fn validate_dependencies(
    available_keys: &HashMap<String, Node>,
    sub_schema: &Value,
) -> Option<Vec<Diagnostic>> {
    let dependencies = sub_schema.get("dependencies")?.as_array()?;

    let mut errors: Vec<Diagnostic> = Vec::new();
    for (i, dep) in dependencies.iter().enumerate() {
        // find the dependency
        let dep_string = dep.is_string();
        if !dep_string {
            continue;
        }

        let dep_val = dep.as_str().unwrap().to_string();
        if available_keys.contains_key(&dep_val) {
            // available_keys are keys that haven't been processed yet
            // key is the name of the node and value is the value node

            let c: Test = {
                match dependencies.get(i) {
                    Some(Value::Array(arr)) => {
                        // filter the non strings
                        Test::Array(arr.iter().filter_map(|f| f.as_str()).collect_vec())
                    }
                    Some(val) => Test::Ref(new_schema_ref(val)),
                    _ => Test::Ref(None),
                }
            };

            errors.extend(_validate_dependencies(&dep_val, available_keys, c));
        }
    }

    return Some(errors);
}

enum Test<'a> {
    Array(Vec<&'a str>),
    Ref(Option<Value>),
}

fn _validate_dependencies(
    prop: &String,
    available_keys: &HashMap<String, Node>,
    dependencies: Test,
) -> Vec<Diagnostic> {
    let mut errors = Vec::new();

    let node = available_keys.get(prop).unwrap().to_owned();
    match dependencies {
        Test::Array(arr) => {
            for req in arr {
                if available_keys.contains_key(req) {
                    errors.push(to_diagnostic(
                        start_position(node),
                        end_position(node),
                        format!("dependencies error"),
                    ));
                }
            }
            return errors;
        }
        _ => {
            // Validate the schema
            return errors;
        }
    }
}
