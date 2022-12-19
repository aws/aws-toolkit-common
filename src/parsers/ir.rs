
use tower_lsp::lsp_types::Position;
use tree_sitter::{Node};

use crate::utils::{tree_sitter::{IRString, IRBoolean, IRObject, IRArray, IRNumber, IRPair, start_position, end_position, IRNull}, text_document::ASTNodeExt};

use super::json_schema::num_utils::convert_i64_to_float;

// Given a json tree sitter tree, we need to return an intermediate representation that can be processed by the smithy validator

// This isn't going to be walked at parse time, it's going to be done at validation time
// that way we keep the speed of parsing the initial tree, and then we re-compute the results

#[derive(Debug)]
pub struct ConversionError {
    msg: String
}

#[derive(Debug, Clone)]
pub enum IR<'a> {
    IRString(IRString),
    IRArray(IRArray<'a>),
    IRBoolean(IRBoolean),
    IRObject(IRObject<'a>),
    IRPair(IRPair<'a>),
    IRNumber(IRNumber),
    IRNull(IRNull)
}

impl IR<'_> {

    pub fn new(node: Node, file_contents: String) -> Option<IR> {
        match node.kind() {
            "pair" => {
                return Some(IR::IRPair(convert_pair(node, file_contents).unwrap()));
            },
            "array" => {
                return Some(IR::IRArray(convert_array(node, file_contents).unwrap()));
            },
            "number" => {
                return Some(IR::IRNumber(convert_number(node, file_contents).unwrap()));
            },
            "string" => {
                return Some(IR::IRString(convert_string(node, file_contents).unwrap()));
            }
            "object" => {
                return Some(IR::IRObject(convert_object(node, file_contents).unwrap()));
            },
            "null" => {
                return Some(IR::IRNull(IRNull::new(start_position(node), end_position(node))));
            },
            "true" | "false" => {
                return Some(IR::IRBoolean(convert_boolean(node, file_contents).unwrap()));
            }
            _ => {
                println!("{}", node.kind());
                return None;
            }
        }
    }

    pub fn get_start(self) -> Position {
        match self {
            IR::IRArray(arr) => arr.start,
            IR::IRBoolean(boo) => boo.start,
            IR::IRNumber(num) => num.start,
            IR::IRObject(obj) => obj.start,
            IR::IRPair(pair) => pair.start,
            IR::IRString(str) => str.start,
            IR::IRNull(null) => null.start
        }
    }

    pub fn get_end(self) -> Position {
        match self {
            IR::IRArray(arr) => arr.end,
            IR::IRBoolean(boo) => boo.end,
            IR::IRNumber(num) => num.end,
            IR::IRObject(obj) => obj.end,
            IR::IRPair(pair) => pair.end,
            IR::IRString(str) => str.end,
            IR::IRNull(null) => null.end
        }
    }

    pub fn get_kind(self) -> String {
        match self {
            IR::IRArray(arr) => arr.kind,
            IR::IRBoolean(boo) => boo.kind,
            IR::IRNumber(num) => num.kind,
            IR::IRObject(obj) => obj.kind,
            IR::IRPair(pair) => pair.kind,
            IR::IRString(str) => str.kind,
            IR::IRNull(null) => null.kind
        }
    }
}

pub fn convert_pair<'a>(root: Node<'a>, file_contents: String) -> Result<IRPair<'a>, ConversionError> {
    let child = root.child(0).unwrap();
    return Ok(IRPair::new(IRString::new(child.get_text(&file_contents), start_position(child), start_position(child)), root.child(2).unwrap(), start_position(root), end_position(root)));
}

pub fn convert_string(node: Node, file_contents: String) -> Result<IRString, ConversionError> {
    let contents = node.get_text(&file_contents);
    return Ok(IRString::new(
        contents,
        start_position(node),
        end_position(node)
    ))
}

pub fn convert_boolean(node: Node, file_contents: String) -> Result<IRBoolean, ConversionError> {
    let contents = node.get_text(&file_contents);

    if contents != "true" && contents != "false" {
        return Err(ConversionError{
            msg: String::from("Could not convert node to boolean")
        })
    }

    let value: bool = contents.parse().unwrap();
    return Ok(IRBoolean::new(value, start_position(node), end_position(node)));
}

pub fn convert_number(node: Node, file_contents: String) -> Result<IRNumber, ConversionError> {
    let val = node.get_text(&file_contents);
    let i64_val = val.parse::<i64>();
    if i64_val.is_ok() {
        return Ok(IRNumber::new(convert_i64_to_float(i64_val.ok().unwrap()), true, start_position(node), end_position(node)));
    }
    
    let f64_val = val.parse::<f64>();
    if f64_val.is_ok() {
        return Ok(IRNumber::new(f64_val.ok().unwrap(), false, start_position(node), end_position(node)));
    }

    return Err(ConversionError{
        msg: String::from("Could not convert node to number")
    })
}

pub fn convert_object<'a>(node: Node<'a>, file_contents: String) -> Result<IRObject<'a>, ConversionError> {
    let mut cursor = node.walk();

    // This moves us from the object node to the first node in the tree which would be {
    cursor.goto_first_child();

    let mut pairs = Vec::new();

    let mut has_child = cursor.goto_next_sibling();
    let mut cur_node = cursor.node();
    while has_child {
        let contents = cur_node.get_text(&file_contents);

        // Skip commas
        if contents == "," || contents == "{" || contents == "}" {
            has_child = cursor.goto_next_sibling();
            cur_node = cursor.node();
            continue;
        }

        let f_child = cur_node.child(0);
        if f_child.is_none() {
            return Err(ConversionError{
                msg: String::from("Expected node but found none")
            })
        }

        let key = f_child.unwrap().get_text(&file_contents);
        
        let s_child = cur_node.child(2);
        if s_child.is_none() {
            return Err(ConversionError{
                msg: String::from("Expected node but found none")
            })
        }

        pairs.push(
            IRPair::new(
                IRString::new(String::from(key), start_position(node), end_position(node)
            ),
            s_child.unwrap().clone(),
            start_position(node),
            end_position(node)
        ));

        has_child = cursor.goto_next_sibling();
        cur_node = cursor.node();
    }

    return Ok(IRObject::new(pairs, start_position(node), end_position(node)));
}    

pub fn convert_array<'a>(node: Node<'a>, file_contents: String) -> Result<IRArray<'a>, ConversionError> {
    let mut cursor = node.walk();

    // This moves us from the array node to the first node in the tree which would be [
    cursor.goto_first_child();

    let mut items = Vec::new();

    let mut has_siblings = cursor.goto_next_sibling();
    let mut cur_node = cursor.node();

    while has_siblings {
        let contents = cur_node.get_text(&file_contents);

        // Skip commas
        if contents == "," || contents == "[" || contents == "]" {
            has_siblings = cursor.goto_next_sibling();
            cur_node = cursor.node();
            continue;
        }

        items.push(cur_node.clone());

        has_siblings = cursor.goto_next_sibling();
        cur_node = cursor.node();
    }

    return Ok(IRArray::new(items, start_position(node), end_position(node)));
    
}
