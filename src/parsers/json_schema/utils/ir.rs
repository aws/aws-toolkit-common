use core::hash::Hash;
use serde_json::{json, Value};
use std::fmt;
use std::{collections::HashMap, fmt::Debug, hash::Hasher};
use tower_lsp::lsp_types::{Diagnostic, Position, Range};
use tree_sitter::Tree;

use crate::parsers::ir::IR;

pub fn new_schema_ref(value: &Value) -> Option<Value> {
    match value {
        Value::Bool(_) => Some(value.clone()),
        Value::Object(obj) => Some(json!(obj)),
        _ => None,
    }
}

pub fn to_diagnostic(start: Position, end: Position, error: String) -> Diagnostic {
    Diagnostic::new(Range::new(start, end), None, None, None, error, None, None)
}

pub fn matches_type(ir_node: &IR, json_type: &str) -> bool {
    match ir_node {
        IR::IRArray(arr) => arr.kind == json_type,
        IR::IRBoolean(boo) => boo.kind == json_type,
        IR::IRNumber(num) => num.kind == json_type || (num.is_integer && json_type == "integer"),
        IR::IRObject(obj) => obj.kind == json_type,
        IR::IRPair(pair) => pair.kind == json_type,
        IR::IRString(str) => str.kind == json_type,
        IR::IRNull(null) => null.kind == json_type,
    }
}

#[derive(PartialEq, Eq)]
pub enum JSONValues {
    String(String),
    Boolean(bool),
    Array(Vec<JSONValues>),
    Object(HashMap<String, JSONValues>),
}

#[allow(clippy::derive_hash_xor_eq)]
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
            }
            JSONValues::String(str) => str.hash(state),
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

pub fn get_value<'a>(ir_node: IR<'a>, file_contents: &'a str) -> JSONValues {
    match ir_node {
        IR::IRArray(arr) => {
            let mut unique_items = Vec::new();
            for item in arr.items {
                let ir_node = IR::new(&item, file_contents);
                if let Some(value) = ir_node {
                    unique_items.push(get_value(value, file_contents));
                }
            }
            JSONValues::Array(unique_items)
        }
        IR::IRBoolean(boo) => JSONValues::Boolean(boo.value),
        IR::IRNumber(num) => {
            // Technically this is kind of a hack, but f64 doesn't support Eq
            JSONValues::String(num.value.to_string())
        }
        IR::IRObject(obj) => {
            let mut unique_objects = HashMap::new();
            for pair in obj.properties {
                let ir_value_node = IR::new(&pair.value, file_contents);
                if let Some(value_node) = ir_value_node {
                    unique_objects.insert(pair.key.contents, get_value(value_node, file_contents));
                }
            }
            JSONValues::Object(unique_objects)
        }
        IR::IRPair(pair) => {
            let mut unique_pair = HashMap::new();
            let ir_value_node = IR::new(&pair.value, file_contents);
            if let Some(value_node) = ir_value_node {
                unique_pair.insert(pair.key.contents, get_value(value_node, file_contents));
            }
            JSONValues::Object(unique_pair)
        }
        IR::IRString(str) => JSONValues::String(str.contents),
        IR::IRNull(_) => JSONValues::String("null".to_string()),
    }
}

// TODO extract this out into its own file/utils stuff
pub fn is_equal(ir_node: &IR, file_contents: &str, value: &Value) -> bool {
    match (ir_node, value) {
        (IR::IRArray(arr), Value::Array(second_arr)) => {
            for (i, node) in arr.items.iter().enumerate() {
                // TODO fix unsafe unwrap
                if !is_equal(
                    &IR::new(node, file_contents).unwrap(),
                    file_contents,
                    second_arr.get(i).unwrap(),
                ) {
                    return false;
                }
            }
            // TODO check the array length?
            true
        }
        (IR::IRBoolean(boo), Value::Bool(second_boo)) => &boo.value == second_boo,
        (IR::IRNumber(num), Value::Number(arr)) => {
            if arr.is_i64() {
                // convert to float
                return num.value == arr.as_f64().unwrap();
            }
            if arr.is_f64() {
                return num.value == arr.as_f64().unwrap();
            }
            false
        }
        (IR::IRObject(obj), Value::Object(second_obj)) => {
            for pair in &obj.properties {
                if !second_obj.contains_key(&pair.key.contents) {
                    return false;
                }

                let second_obj_value = second_obj.get(&pair.key.contents).unwrap();

                let ir_value_node = IR::new(&pair.value, file_contents).unwrap();

                let equal = is_equal(&ir_value_node, file_contents, second_obj_value);
                if !equal {
                    return false;
                }
            }
            true
        }
        (IR::IRString(str), Value::String(cmp_val)) => &str.contents == cmp_val,
        (IR::IRNull(_), Value::Null) => true,
        (_, _) => false,
    }
}

pub fn parse(text: &str) -> Tree {
    let mut parser = tree_sitter::Parser::new();
    parser
        .set_language(tree_sitter_json::language())
        .expect("Error loading json grammar");
    parser.parse(text, None).unwrap()
}
