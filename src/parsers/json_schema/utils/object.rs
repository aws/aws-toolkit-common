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
    pub closest_pair: Option<String>,
    text: String,
    start: Position,
    end: Position,
}

impl NodeIdentifier {
    pub fn new(node: Node, file_contents: &str) -> Self {
        let text = node.get_text(file_contents);
        let start = start_position(node);
        let end = end_position(node);

        NodeIdentifier {
            closest_pair: find_pair(node, file_contents),
            text,
            start,
            end,
        }
    }
}

fn find_pair(node: Node, file_contents: &str) -> Option<String> {
    let parent = node.parent()?;
    if node.kind() == "string_content" {
        let grandparent = parent.parent()?;
        return Some(grandparent.get_text(file_contents));
    }

    if parent.kind() == "pair" {
        return Some(parent.get_text(file_contents));
    }

    if node.kind() == "pair" {
        return Some(node.get_text(file_contents));
    }

    None
}
