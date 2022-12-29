use tower_lsp::lsp_types::Position;
use tree_sitter::Node;

pub fn start_position(node: &Node) -> Position {
    Position::new(
        node.start_position().row.try_into().unwrap(),
        node.start_position().column.try_into().unwrap(),
    )
}

pub fn end_position(node: &Node) -> Position {
    Position::new(
        node.end_position().row.try_into().unwrap(),
        node.end_position().column.try_into().unwrap(),
    )
}

#[derive(Debug, Clone)]
pub struct IRNull<'a> {
    pub kind: &'a str,
    pub start: Position,
    pub end: Position,
}

impl<'a> IRNull<'a> {
    pub fn new(start: Position, end: Position) -> IRNull<'a> {
        IRNull {
            kind: "null",
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRString<'a> {
    pub kind: &'a str,
    pub contents: String,
    pub start: Position,
    pub end: Position,
}

impl<'a> IRString<'a> {
    pub fn new(contents: String, start: Position, end: Position) -> IRString<'a> {
        IRString {
            kind: "string",
            contents,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRBoolean<'a> {
    pub kind: &'a str,
    pub value: bool,
    pub start: Position,
    pub end: Position,
}

impl<'a> IRBoolean<'a> {
    pub fn new(value: bool, start: Position, end: Position) -> IRBoolean<'a> {
        IRBoolean {
            kind: "boolean",
            value,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRObject<'a> {
    pub kind: &'a str,
    pub properties: Vec<IRPair<'a>>,
    pub start: Position,
    pub end: Position,
}

impl IRObject<'_> {
    pub fn new(properties: Vec<IRPair>, start: Position, end: Position) -> IRObject {
        IRObject {
            kind: "object",
            properties,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRArray<'a> {
    pub kind: &'a str,
    pub items: Vec<Node<'a>>,
    pub start: Position,
    pub end: Position,
}

impl IRArray<'_> {
    pub fn new(items: Vec<Node>, start: Position, end: Position) -> IRArray {
        IRArray {
            kind: "array",
            items,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRNumber<'a> {
    pub kind: &'a str,
    pub is_integer: bool, // json schema differenties between integer and number types
    pub value: f64,
    pub start: Position,
    pub end: Position,
}

impl<'a> IRNumber<'a> {
    pub fn new(value: f64, is_integer: bool, start: Position, end: Position) -> IRNumber<'a> {
        IRNumber {
            kind: "number",
            is_integer,
            value,
            start,
            end,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IRPair<'a> {
    pub kind: &'a str,
    pub key: IRString<'a>,
    pub value: Node<'a>,
    pub start: Position,
    pub end: Position,
}

impl<'a> IRPair<'a> {
    pub fn new(key: IRString<'a>, value: Node<'a>, start: Position, end: Position) -> IRPair<'a> {
        IRPair {
            kind: "pair",
            key,
            value,
            start,
            end,
        }
    }
}
