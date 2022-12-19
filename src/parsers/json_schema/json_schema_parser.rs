use std::collections::HashMap;

use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use tree_sitter::{TreeCursor, Tree};
use crate::{utils::{tree_sitter::{IRArray, IRString, IRNumber, IRObject}}, parsers::ir::IR};

use super::{keywords::{min_items::validate_min_items, max_items::validate_max_items, min_length::validate_min_length, max_length::validate_max_length, pattern::validate_pattern, multiple_of::validate_multiple_of, exclusive_minimum::validate_exclusive_minimum, exclusive_maximum::validate_exclusive_maximum, minimum::validate_minimum, maximum::validate_maximum, properties::validate_properties, max_properties::validate_max_properties, min_properties::validate_min_properties, required::validate_required, json_type::validate_type, pattern_properties::validate_pattern_properties, additional_properties::validate_additional_properties, unique_items::validate_unique_items, additional_items::validate_additional_items, json_enum::validate_enum, format::validate_format, dependencies::validate_dependencies}};

pub struct Validate {
    tree: Tree,
    schema: Value,
    contents: String
}

impl Validate {

    pub fn new(tree: Tree, schema: Value, file_contents: String) -> Self {
        // TODO when adding yaml support, make the converter depend on the incoming language
        return Validate { 
            tree,
            schema,
            contents: file_contents,
        }
    }

    pub fn validate(&self) -> Vec<Diagnostic> {
        let cursor = self.tree.walk();
        return self.validate_root(cursor, &self.schema)
    }
    
    pub fn validate_root(&self, mut cursor: TreeCursor, sub_schema: &Value) -> Vec<Diagnostic> {
        let node = cursor.node();

        if node.kind() == "document" || node.kind() == "{" {
            println!("{}", node.kind());
            let deep = cursor.goto_first_child();
            if !deep {
                cursor.goto_next_sibling();
            }
            return self.validate_root(cursor, sub_schema);
        }

        println!("{}", node.kind());
    
        let ir_nodes = IR::new(node, self.contents.clone());
        if ir_nodes.is_none() {
            return Vec::new();
        }

        let node_errors = self.validate_node(ir_nodes.clone().unwrap(), sub_schema);

        match ir_nodes.unwrap() {
            IR::IRString(key) => {
                let str_errors = self.validate_string(key, sub_schema);
                return [node_errors, str_errors].concat();
            },
            IR::IRArray(arr) => {
                let array_errors = self.validate_array(arr, sub_schema);
                return [node_errors, array_errors].concat();
            },
            IR::IRBoolean(_) => {
                return node_errors;
            },
            IR::IRObject(obj) => {
                let obj_errors = self.validate_object(obj, sub_schema);
                return [node_errors, obj_errors].concat();
            },
            IR::IRPair(pair) => {
                // TODO handle error on unwrapping the children
                let key_errors = self.validate_root(node.child(0).unwrap().walk(), sub_schema);
                let value_errors = self.validate_root(pair.value.walk(), sub_schema);
                return [node_errors, key_errors, value_errors].concat();
            },
            IR::IRNumber(num) => {
                let num_errors = self.validate_number(num, sub_schema);
                return [node_errors, num_errors].concat();
            },
            IR::IRNull(_) => {
                return node_errors;
            }
        }
    }

    fn validate_node(&self, ir_node: IR, sub_schema: &Value) -> Vec<Diagnostic> {
        let mut errors = Vec::new();

        if let Some(error) = validate_type(&ir_node, sub_schema) {
            errors.push(error);
        }

        if let Some(error) = validate_enum(&ir_node, &self.contents, sub_schema) {
            errors.push(error);
        }

        return errors;
    }

    // pair corresponds to a json node such as "a": "test" or "a": {} or "a": [] or "a": false
    // validate my Pair node from tree_sitter.rs against wherever we are in the smithy document
    // this is otherwise known as an Object
    fn validate_object(&self, obj: IRObject, sub_schema: &Value) -> Vec<Diagnostic> {
        let mut errors = Vec::new();

        let mut available_keys = HashMap::new();
        for prop in &obj.properties {
            available_keys.insert(prop.key.contents.to_string(), prop.value);
        }
    
        if let Some(error) = validate_properties(self, &mut available_keys, sub_schema) {
            errors.extend(error);
        }

        if let Some(error) = validate_pattern_properties(self, &mut available_keys, sub_schema) {
            errors.extend(error);
        }

        if let Some(error) = validate_additional_properties(self, &mut available_keys, sub_schema) {
            errors.extend(error);
        }

        if let Some(error) = validate_dependencies(&available_keys, sub_schema) {
            errors.extend(error);
        }
        
        if let Some(error) = validate_max_properties(&obj, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_min_properties(&obj, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_required(&obj, sub_schema) {
            errors.push(error);
        }
        return errors;
    }

    fn validate_array(&self, array: IRArray, sub_schema: &Value) -> Vec<Diagnostic> {
        let mut errors: Vec<Diagnostic> = Vec::new();
        if let Some(error) = validate_min_items(&array, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_max_items(&array, sub_schema) {
            errors.push(error);
        }

        // We need to get the indexes of the prefixs
        if let Some(error) = validate_additional_items(self, &array, sub_schema) {
            errors.extend(error);
        }
        if let Some(error) = validate_unique_items(&array, &self.contents, sub_schema) {
            errors.extend(error);
        }
        return errors;
    }

    fn validate_string(&self, content: IRString, sub_schema: &Value) -> Vec<Diagnostic> {
        let mut errors: Vec<Diagnostic> = Vec::new();
        if let Some(error) = validate_min_length(&content, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_max_length(&content, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_pattern(&content, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_format(&content, sub_schema) {
            errors.push(error);
        }
        return errors;
    }

    fn validate_number(&self, number: IRNumber, sub_schema: &Value) -> Vec<Diagnostic> {
        let mut errors: Vec<Diagnostic> = Vec::new();
        if let Some(error) = validate_multiple_of(&number, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_exclusive_minimum(&number, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_exclusive_maximum(&number, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_minimum(&number, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_maximum(&number, sub_schema) {
            errors.push(error);
        }
        return errors;
    }

}

#[cfg(test)]
mod tests {
    use serde_json::{Value, json};
    use tower_lsp::lsp_types::Diagnostic;
    use tree_sitter::Tree;

    use super::Validate;

    fn parse(text: String) -> Tree {
        let mut parser = tree_sitter::Parser::new();
        parser.set_language(tree_sitter_json::language()).expect("Error loading json grammar");
        return parser.parse(text, None).unwrap();
    }

    fn validation_test(contents: String, schema: Value) -> Vec<Diagnostic> {
        let parse_result = parse(contents.to_string());
        let val = Validate {
            tree: parse_result,
            contents,
            schema,
        };
        return val.validate();
    }

    #[test]
    fn basic_validation() {
        let result = validation_test(
            r#"{
                "version": "1"
            }"#.to_string(), json!({
                "$schema": "http://json-schema.org/draft-04/schema#",
                "type": "object",
                "properties": {
                  "version": {
                    "type": "string",
                    "minLength": 5,
                    "maxLength": 5
                  }
                },
                "required": [
                  "version"
                ]
              })
        );
        assert_eq!(result.len(), 0);
    }

}
