use std::collections::HashMap;

use crate::{
    parsers::ir::IR,
    utils::tree_sitter::{IRArray, IRNumber, IRObject, IRString},
};
use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use tree_sitter::{Tree, TreeCursor};

use super::keywords::{
    additional_items::validate_additional_items,
    additional_properties::validate_additional_properties, dependencies::validate_dependencies,
    exclusive_maximum::validate_exclusive_maximum, exclusive_minimum::validate_exclusive_minimum,
    format::validate_format, json_enum::validate_enum, json_type::validate_type,
    max_items::validate_max_items, max_length::validate_max_length,
    max_properties::validate_max_properties, maximum::validate_maximum,
    min_items::validate_min_items, min_length::validate_min_length,
    min_properties::validate_min_properties, minimum::validate_minimum,
    multiple_of::validate_multiple_of, pattern::validate_pattern,
    pattern_properties::validate_pattern_properties, properties::validate_properties,
    required::validate_required, unique_items::validate_unique_items,
};

pub struct Validate {
    tree: Tree,
    schema: Value,
    contents: String,
}

#[derive(Clone, Debug)]
pub struct Validation {
    pub errors: Vec<Diagnostic>,
    pub schema_matches: Vec<Box<Value>>
}

impl Default for Validation {
    fn default() -> Self {
        Self::new()
    }
}

impl Validation {
    pub fn new() -> Self {
        Validation {
            errors: Vec::new(),
            schema_matches: Vec::new()
        }
    }

    pub fn merge(self, val: Validation) -> Self {
        Validation {
            errors: [self.errors, val.errors].concat(),
            schema_matches: [self.schema_matches, val.schema_matches].concat()
        }
    }

    pub fn merge_all(self, val: Vec<Validation>) -> Self {
        let mut errors = Vec::new();
        let mut schemas = Vec::new();
        for mut v in val {
            errors.append(&mut v.errors);
            schemas.append(&mut v.schema_matches);
        }
        Validation {
            errors: [self.errors, errors].concat(),
            schema_matches: [self.schema_matches, schemas].concat()
        }
    }
}

impl Validate {
    pub fn new(tree: Tree, schema: Value, file_contents: String) -> Self {
        // TODO when adding yaml support, make the converter depend on the incoming language
        Validate {
            tree,
            schema,
            contents: file_contents,
        }
    }

    pub fn validate(&self) -> Validation {
        let cursor = self.tree.walk();
        self.validate_root(cursor, &self.schema)
    }

    pub fn validate_root(&self, mut cursor: TreeCursor, sub_schema: &Value) -> Validation {
        let node = cursor.node();

        if node.kind() == "document" || node.kind() == "{" {
            let deep = cursor.goto_first_child();
            if !deep {
                cursor.goto_next_sibling();
            }
            return self.validate_root(cursor, sub_schema);
        }

        let ir_nodes = IR::new(node, self.contents.clone());
        if ir_nodes.is_none() {
            return Validation::new();
        }

        let mut node_validation = self.validate_node(ir_nodes.clone().unwrap(), sub_schema);

        // TODO I don't think we should be boxing then cloneing here. We technically need this to last
        // the lifetime of Validate but we don't want _all_ values to last the lifetime so it's used in the meantime
        node_validation.schema_matches.push(Box::new(sub_schema.clone()));

        match ir_nodes.unwrap() {
            IR::IRString(key) => {
                let str_errors = self.validate_string(key, sub_schema);
                node_validation.errors = [node_validation.errors, str_errors].concat();
                node_validation
            }
            IR::IRArray(arr) => {
                let array_errors = self.validate_array(arr, sub_schema);
                node_validation.merge(array_errors)
            }
            IR::IRBoolean(_) => {
                node_validation
            }
            IR::IRObject(obj) => {
                let obj_validation = self.validate_object(obj, sub_schema);
                node_validation.merge(obj_validation)
            }
            IR::IRPair(pair) => {
                // TODO handle error on unwrapping the children
                let key_errors = self.validate_root(node.child(0).unwrap().walk(), sub_schema);
                let value_errors = self.validate_root(pair.value.walk(), sub_schema);
                let key_merge = node_validation.merge(key_errors);
                key_merge.merge(value_errors)
            }
            IR::IRNumber(num) => {
                let num_errors = self.validate_number(num, sub_schema);
                node_validation.errors = [node_validation.errors, num_errors].concat();
                node_validation
            }
            IR::IRNull(_) => {
                node_validation
            }
        }
    }

    fn validate_node(&self, ir_node: IR, sub_schema: &Value) -> Validation {
        let mut validations = Validation::new();

        let mut errors = Vec::new();

        if let Some(error) = validate_type(&ir_node, sub_schema) {
            errors.push(error);
        }

        if let Some(error) = validate_enum(&ir_node, &self.contents, sub_schema) {
            errors.push(error);
        }
        validations.errors = errors;
        validations.schema_matches.push(Box::new(sub_schema.to_owned()));
        validations
    }

    fn validate_object(&self, obj: IRObject, sub_schema: &Value) -> Validation {
        let mut validations = Validation::new();

        let mut errors = Vec::new();

        let mut available_keys = HashMap::new();
        for prop in &obj.properties {
            available_keys.insert(prop.key.contents.to_string(), prop.value);
        }

        // TODO get rid of the mutations for available keys and instead remove all the keys after each response here
        if let Some(validation) = validate_properties(self, &mut available_keys, sub_schema) {
            validations = validations.merge_all(validation);
        }

        if let Some(validation) = validate_pattern_properties(self, &mut available_keys, sub_schema) {
            validations = validations.merge_all(validation);
        }

        if let Some(validation) = validate_additional_properties(self, &mut available_keys, sub_schema) {
            validations = validations.merge_all(validation);
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
        validations.errors = [validations.errors, errors].concat();
        validations
    }

    fn validate_array(&self, array: IRArray, sub_schema: &Value) -> Validation {
        let mut validations = Validation::new();

        let mut errors: Vec<Diagnostic> = Vec::new();
        if let Some(error) = validate_min_items(&array, sub_schema) {
            errors.push(error);
        }
        if let Some(error) = validate_max_items(&array, sub_schema) {
            errors.push(error);
        }
        if let Some(validation) = validate_additional_items(self, &array, sub_schema) {
            validations = validations.merge_all(validation);
        }
        if let Some(error) = validate_unique_items(&array, &self.contents, sub_schema) {
            errors.push(error);
        }

        validations.errors = [validations.errors, errors].concat();
        validations
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
        errors
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
        errors
    }
}

#[cfg(test)]
mod tests {
    use serde_json::{json, Value};
    use tower_lsp::lsp_types::Diagnostic;

    use crate::parsers::json_schema::utils::parse;

    use super::Validate;

    fn validation_test(contents: String, schema: Value) -> Vec<Diagnostic> {
        let parse_result = parse(contents.to_string());
        let val = Validate::new(parse_result, schema, contents);
        let validation = val.validate();
        println!("{:?}", validation.schema_matches);
        validation.errors
    }

    #[test]
    fn basic_validation() {
        let result = validation_test(
            r#"{
                "version": "testing"
            }"#
            .to_string(),
            json!({
              "$schema": "http://json-schema.org/draft-04/schema#",
              "type": "object",
              "properties": {
                "version": {
                  "type": "string",
                  "minLength": 0,
                  "maxLength": 10
                }
              },
              "required": [
                "version"
              ]
            }),
        );
        assert_eq!(result.len(), 0);
    }
}
