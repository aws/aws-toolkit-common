use std::{collections::HashMap, hash::Hasher, fmt::Debug};
use core::hash::Hash;
use serde_json::{Value, json};
use tower_lsp::lsp_types::{Diagnostic, Range, Position};
use tree_sitter::Tree;
use std::fmt;

use crate::parsers::ir::IR;

pub fn new_schema_ref(value: &Value) -> Option<Value> {
    match value {
        Value::Bool(_) => Some(value.clone()),
        Value::Object(obj) => Some(json!(obj)),
        _ => None
    }
}

pub fn to_diagnostic(start: Position, end: Position, error: String) -> Diagnostic {
    return Diagnostic::new(Range::new(start, end), None, None, None, error, None, None);
}

pub fn matches_type(ir_node: &IR, json_type: &str) -> bool {
    match ir_node {
        IR::IRArray(arr) => {
            return arr.kind == json_type;
        },
        IR::IRBoolean(boo) => {
            return boo.kind == json_type;
        },
        IR::IRNumber(num) => {
            return num.kind == json_type || (num.is_integer && json_type == "integer");
        },
        IR::IRObject(obj) => {
            return obj.kind == json_type;
        },
        IR::IRPair(pair) => {
            return pair.kind == json_type;
        },
        IR::IRString(str) => {
            return str.kind == json_type;
        },
        IR::IRNull(null) => {
            return null.kind == json_type;
        }
    }
}

#[derive(PartialEq, Eq)]
pub enum JSONValues {
    String(String),
    Boolean(bool),
    Array(Vec<JSONValues>),
    Object(HashMap<String, JSONValues>)
}

impl Hash for JSONValues {
    fn hash<H: Hasher>(&self, state: &mut H) {
        match self {
            JSONValues::Array(arr) => arr.hash(state),
            JSONValues::Boolean(boo) => boo.hash(state),
            JSONValues::Object(obj) => {
                for (key, value) in obj {
                    key.hash(state);
                    value.hash(state);
                }
            },
            JSONValues::String(str) => str.hash(state)
        }
    }
}

impl Debug for JSONValues {
    fn fmt(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
        match self {
            JSONValues::Boolean(boolean) => write!(formatter, "{}", boolean),
            JSONValues::String(string) => write!(formatter, "{}", string),
            JSONValues::Array(vec) => {
                formatter.write_str("Array ")?;
                Debug::fmt(vec, formatter)
            }
            JSONValues::Object(map) => {
                formatter.write_str("Object ")?;
                Debug::fmt(map, formatter)
            }
        }
    }
}

pub fn get_value(ir_node: IR, file_contents: &String) -> JSONValues {
    match ir_node {
        IR::IRArray(arr) => {
            let mut unique_items = Vec::new();
            for item in arr.items {
                let ir_node = IR::new(item, file_contents.to_string());
                if ir_node.is_some() {
                    unique_items.push(get_value(ir_node.unwrap(), file_contents));
                }
            }
            return JSONValues::Array(unique_items);
        },
        IR::IRBoolean(boo) => {
            return JSONValues::Boolean(boo.value);
        },
        IR::IRNumber(num) => {
            // Technically this is kind of a hack, but f64 doesn't support Eq
            return JSONValues::String(num.value.to_string());
        },
        IR::IRObject(obj) => {
            let mut unique_objects = HashMap::new();
            for pair in obj.properties {
                let ir_value_node = IR::new(pair.value, file_contents.to_string());
                if ir_value_node.is_some() {
                    unique_objects.insert(pair.key.contents, get_value(ir_value_node.unwrap(), file_contents));
                }
            }
            return JSONValues::Object(unique_objects);
        },
        IR::IRPair(pair) => {
            let mut unique_pair = HashMap::new();
            let ir_value_node = IR::new(pair.value, file_contents.to_string());
            if ir_value_node.is_some() {
                unique_pair.insert(pair.key.contents, get_value(ir_value_node.unwrap(), file_contents));
            }
            return JSONValues::Object(unique_pair);
        },
        IR::IRString(str) => {
            return JSONValues::String(str.contents);
        },
        IR::IRNull(_) => {
            return JSONValues::String("null".to_string());
        }
    }
}

// TODO extract this out into its own file/utils stuff
pub fn is_equal(ir_node: &IR, file_contents: &String, value: &Value) -> bool {
    println!("{}, {}", ir_node.clone().get_kind(), value);
    match (ir_node, value) {
        (IR::IRArray(arr), Value::Array(second_arr)) => {
            for (i, node) in arr.items.iter().enumerate() {
                // TODO fix unsafe unwrap
                if !is_equal(&IR::new(*node, file_contents.to_string()).unwrap(), file_contents, second_arr.get(i).unwrap()) {
                    return false;
                }
            }
            // TODO check the array length?
            return true;
        },
        (IR::IRBoolean(boo), Value::Bool(second_boo)) => {
            return &boo.value == second_boo;
        },
        (IR::IRNumber(num), Value::Number(arr)) => {
            if arr.is_i64() {
                // convert to float
                return num.value == arr.as_f64().unwrap();
            }
            if arr.is_f64() {
                return num.value == arr.as_f64().unwrap();
            }
            return false;
        },
        (IR::IRObject(obj), Value::Object(second_obj)) => {
            for pair in &obj.properties {
                if !second_obj.contains_key(&pair.key.contents) {
                    return false;
                }

                let second_obj_value = second_obj.get(&pair.key.contents).unwrap();


                let ir_value_node = IR::new(pair.value, file_contents.to_string()).unwrap();
                
                let equal = is_equal(&ir_value_node, file_contents, second_obj_value);
                if !equal {
                    return false;
                }
                
            }
            return true;
        },
        (IR::IRString(str), Value::String(cmp_val)) => {
            return &str.contents == cmp_val;
        },
        (IR::IRNull(_), Value::Null) => {
            return true;
        },
        (_, _) => {
            return false;
        }
    }
}

pub fn parse(text: String) -> Tree {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(tree_sitter_json::language()).expect("Error loading json grammar");
    return parser.parse(text, None).unwrap();
}
