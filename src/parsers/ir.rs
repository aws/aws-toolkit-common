use tower_lsp::lsp_types::Position;
use tree_sitter::Node;

use crate::utils::{
    text_document::ASTNodeExt,
    tree_sitter::{
        end_position, start_position, IRArray, IRBoolean, IRNull, IRNumber, IRObject, IRPair,
        IRString,
    },
};

use super::json_schema::utils::num::convert_i64_to_float;

#[derive(Debug, Clone)]
pub enum IR<'a> {
    IRString(IRString<'a>),
    IRArray(IRArray<'a>),
    IRBoolean(IRBoolean<'a>),
    IRObject(IRObject<'a>),
    IRPair(IRPair<'a>),
    IRNumber(IRNumber<'a>),
    IRNull(IRNull<'a>),
}

impl<'a> IR<'a> {
    pub fn new(node: &'a Node, file_contents: &'a str) -> Option<IR<'a>> {
        match node.kind() {
            "pair" => {
                let pair = convert_pair(node, file_contents)?;
                return Some(IR::IRPair(pair));
            }
            "array" => {
                let arr = convert_array(node, file_contents)?;
                return Some(IR::IRArray(arr));
            }
            "number" => {
                let num = convert_number(node, file_contents)?;
                return Some(IR::IRNumber(num));
            }
            "string" => {
                let str = convert_string(node, file_contents)?;
                return Some(IR::IRString(str));
            }
            "object" => {
                let obj = convert_object(node, file_contents)?;
                return Some(IR::IRObject(obj));
            }
            "null" => {
                return Some(IR::IRNull(IRNull::new(
                    start_position(node),
                    end_position(node),
                )));
            }
            "true" | "false" => {
                let boo = convert_boolean(node, file_contents)?;
                return Some(IR::IRBoolean(boo));
            }
            _ => None,
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
            IR::IRNull(null) => null.start,
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
            IR::IRNull(null) => null.end,
        }
    }

    pub fn get_kind(self) -> &'a str {
        match self {
            IR::IRArray(arr) => arr.kind,
            IR::IRBoolean(boo) => boo.kind,
            IR::IRNumber(num) => num.kind,
            IR::IRObject(obj) => obj.kind,
            IR::IRPair(pair) => pair.kind,
            IR::IRString(str) => str.kind,
            IR::IRNull(null) => null.kind,
        }
    }
}

pub fn convert_pair<'a>(root: &'a Node, file_contents: &'a str) -> Option<IRPair<'a>> {
    let child = &root.child(0)?;
    return Some(IRPair::new(
        IRString::new(
            child.get_text(file_contents),
            start_position(child),
            start_position(child),
        ),
        root.child(2)?,
        start_position(root),
        end_position(root),
    ));
}

pub fn convert_string<'a>(node: &Node, file_contents: &'a str) -> Option<IRString<'a>> {
    let contents = node.get_text(file_contents);
    Some(IRString::new(
        contents,
        start_position(node),
        end_position(node),
    ))
}

pub fn convert_boolean<'a>(node: &Node, file_contents: &'a str) -> Option<IRBoolean<'a>> {
    let contents = node.get_text(file_contents);

    if contents != "true" && contents != "false" {
        return None;
    }

    let value: bool = contents.parse().unwrap();
    Some(IRBoolean::new(
        value,
        start_position(node),
        end_position(node),
    ))
}

pub fn convert_number<'a>(node: &Node, file_contents: &'a str) -> Option<IRNumber<'a>> {
    let val = node.get_text(file_contents);
    let i64_val = val.parse::<i64>();
    if i64_val.is_ok() {
        return Some(IRNumber::new(
            convert_i64_to_float(i64_val.ok()?),
            true,
            start_position(node),
            end_position(node),
        ));
    }

    let f64_val = val.parse::<f64>();
    if f64_val.is_ok() {
        return Some(IRNumber::new(
            f64_val.ok()?,
            false,
            start_position(node),
            end_position(node),
        ));
    }

    None
}

pub fn convert_object<'a>(node: &'a Node, file_contents: &'a str) -> Option<IRObject<'a>> {
    let mut cursor = node.walk();

    // This moves us from the object node to the first node in the tree which would be {
    cursor.goto_first_child();

    let mut pairs = Vec::new();

    let mut has_child = cursor.goto_next_sibling();
    let mut cur_node = cursor.node();
    while has_child {
        let contents = cur_node.get_text(file_contents);

        // Skip commas
        if contents == "," || contents == "{" || contents == "}" {
            has_child = cursor.goto_next_sibling();
            cur_node = cursor.node();
            continue;
        }

        let f_child = cur_node.child(0)?;
        let key = f_child.get_text(file_contents);

        let s_child = cur_node.child(2)?;

        pairs.push(IRPair::new(
            IRString::new(key, start_position(node), end_position(node)),
            s_child,
            start_position(node),
            end_position(node),
        ));

        has_child = cursor.goto_next_sibling();
        cur_node = cursor.node();
    }

    Some(IRObject::new(
        pairs,
        start_position(node),
        end_position(node),
    ))
}

pub fn convert_array<'a>(node: &'a Node, file_contents: &'a str) -> Option<IRArray<'a>> {
    let mut cursor = node.walk();

    // This moves us from the array node to the first node in the tree which would be [
    cursor.goto_first_child();

    let mut items = Vec::new();

    let mut has_siblings = cursor.goto_next_sibling();
    let mut cur_node = cursor.node();

    while has_siblings {
        let contents = cur_node.get_text(file_contents);

        // Skip commas
        if contents == "," || contents == "[" || contents == "]" {
            has_siblings = cursor.goto_next_sibling();
            cur_node = cursor.node();
            continue;
        }

        items.push(cur_node);

        has_siblings = cursor.goto_next_sibling();
        cur_node = cursor.node();
    }

    Some(IRArray::new(
        items,
        start_position(node),
        end_position(node),
    ))
}
