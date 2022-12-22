use tower_lsp::lsp_types::Position;
use tree_sitter::Node;

use crate::{
    parsers::parser::ParseResult,
    utils::{
        text_document::ASTNodeExt,
        tree_sitter::{end_position, start_position},
    },
};

pub struct Properties {
    pub keys_used: Vec<String>,
    pub validation: Vec<ParseResult>,
}

// Used for uniquely identifying a node without having a store an entire node on the heap
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct NodeIdentifier {
    parent: Option<String>,
    text: String,
    start: Position,
    end: Position,
}

impl NodeIdentifier {
    pub fn new(node: Node, file_contents: &str) -> Self {
        let parent = node.parent().unwrap().kind();
        let text = node.get_text(file_contents);
        let start = start_position(node);
        let end = end_position(node);

        NodeIdentifier {
            text,
            parent: Some(parent.to_string()),
            start,
            end,
        }
    }
}
