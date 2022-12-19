use itertools::Itertools;
use serde_json::{Value, json};
use tower_lsp::lsp_types::Diagnostic;
use std::cmp;

use crate::{parsers::json_schema::{json_schema_parser::Validate, utils::{to_diagnostic, new_schema_ref}, errors::additional_items_error}, utils::tree_sitter::IRArray};

#[derive(Clone)]
enum Items {
    Array(Vec<Value>),
    Object(Value)
}

fn get_items(sub_schema: &Value) -> Option<Items> {
    let items_property = sub_schema.get("items")?;

    // TODO schema refs should be checked that the unwrap was successful before continuing
    match items_property {
        Value::Array(arr) => {
            return Some(Items::Array(arr.iter().filter_map(|f| new_schema_ref(f)).collect_vec()));
        },
        Value::Object(obj) => {
            return Some(Items::Object(new_schema_ref(&json!(obj)).unwrap()));
        },
        _ => None
    }
}

fn get_additional_items(sub_schema: &Value) -> Option<Value> {
    let additional_items = sub_schema.get("additionalItems")?;
    if !additional_items.is_boolean() && !additional_items.is_object() {
        return None;
    }

    let schema_ref = new_schema_ref(additional_items);
    if schema_ref.is_some() {
        return Some(schema_ref.unwrap());
    }
    return None;
}

fn get_items_schema(items: &Option<Items>) -> Option<Vec<Value>> {
    match items {
        Some(Items::Array(arr)) => Some(arr.to_vec()),
        _ => None
    }
}

fn get_additional_items_schema(items: &Option<Items>, additional_items: Option<Value>) -> Option<Value> {
    match items {
        Some(Items::Array(_)) => {
            return additional_items;
        },
        Some(Items::Object(obj)) => {
            return Some(obj.to_owned())
        },
        _ => None
    }
}

pub fn validate_additional_items(validate: &Validate, node: &IRArray, sub_schema: &Value) -> Option<Vec<Diagnostic>> {
    let potential_items = &get_items(sub_schema);
    let potential_additional_items = get_additional_items(sub_schema);
    let potential_items_schema = &get_items_schema(potential_items);
    let additional_items_schema = get_additional_items_schema(potential_items, potential_additional_items);

    let mut errors = Vec::new();

    if potential_items_schema.is_some() {
        let items_schema = potential_items_schema.as_ref().unwrap();

        // Validate as many of the items as we can
        let min = cmp::min(node.items.len(), items_schema.len());

        let mut index = 0;
        while index < min {
            let node_schema = &items_schema[index];
            let item = node.items.get(index);
            if item.is_some() {
                errors.extend(validate.validate_root(item.unwrap().walk(), &node_schema));
            }
            index += 1;
        }
    }

    if additional_items_schema.is_none() {
        return Some(errors);
    }

    // Keep track of how many items have been processed, either 0 or the total number of items in the schema
    let mut processed_items = 0;
    if potential_items_schema.is_some() {
        processed_items = potential_items_schema.as_ref().unwrap().len();

    }

    // We've already processed all the nodes against the schemas
    if processed_items >= node.items.len() {
        return Some(errors);
    }

    match additional_items_schema {
        Some(Value::Bool(boo)) => {
            if boo == false {
                errors.push(to_diagnostic(node.start, node.end, additional_items_error(processed_items, node.items.len())));
            }
            return Some(errors);
        },
        Some(Value::Object(obj)) => {
            let max_length = cmp::max(node.items.len(), processed_items);
            for i in processed_items..max_length {
                errors.extend(validate.validate_root(node.items[i].walk(), &json!(obj)));
            }

            return Some(errors);
        },
        _ => {
            return Some(errors);
        }
    }    
}
