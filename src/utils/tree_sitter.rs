use tower_lsp::lsp_types::Position;
use tree_sitter::Node;

pub fn start_position(node: Node) -> Position {
    Position::new(
        node.start_position().row.try_into().unwrap(),
        node.start_position().column.try_into().unwrap(),
    )
}

pub fn end_position(node: Node) -> Position {
    Position::new(
        node.end_position().row.try_into().unwrap(),
        node.end_position().column.try_into().unwrap(),
    )
}

#[derive(Debug, Clone)]
pub struct IRNull {
    pub kind: String,
    pub start: Position,
    pub end: Position,
}

impl IRNull {
    pub fn new(start: Position, end: Position) -> IRNull {
        IRNull {
            kind: String::from("null"),
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRString {
    pub kind: String,
    pub contents: String,
    pub start: Position,
    pub end: Position,
}

impl IRString {
    pub fn new(contents: String, start: Position, end: Position) -> IRString {
        IRString {
            kind: String::from("string"),
            contents,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRBoolean {
    pub kind: String,
    pub value: bool,
    pub start: Position,
    pub end: Position,
}

impl IRBoolean {
    pub fn new(value: bool, start: Position, end: Position) -> IRBoolean {
        IRBoolean {
            kind: String::from("boolean"),
            value,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRObject<'a> {
    pub kind: String,
    pub properties: Vec<IRPair<'a>>,
    pub start: Position,
    pub end: Position,
}

impl IRObject<'_> {
    pub fn new(properties: Vec<IRPair>, start: Position, end: Position) -> IRObject {
        IRObject {
            kind: String::from("object"),
            properties,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRArray<'a> {
    pub kind: String,
    pub items: Vec<Node<'a>>,
    pub start: Position,
    pub end: Position,
}

impl IRArray<'_> {
    pub fn new(items: Vec<Node>, start: Position, end: Position) -> IRArray {
        IRArray {
            kind: String::from("array"),
            items,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRNumber {
    pub kind: String,
    pub is_integer: bool, // json schema differenties between integer and number types
    pub value: f64,
    pub start: Position,
    pub end: Position,
}

impl IRNumber {
    pub fn new(value: f64, is_integer: bool, start: Position, end: Position) -> IRNumber {
        IRNumber {
            kind: String::from("number"),
            is_integer,
            value,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRPair<'a> {
    pub kind: String,
    pub key: IRString,
    pub value: Node<'a>,
    pub start: Position,
    pub end: Position,
}

impl IRPair<'_> {
    pub fn new(key: IRString, value: Node, start: Position, end: Position) -> IRPair {
        IRPair {
            kind: String::from("pair"),
            key,
            value,
            start,
            end,
        }
    }
}
