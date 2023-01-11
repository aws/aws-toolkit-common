use crate::parsers::parser::ParseResult;
use tree_sitter::{Node, Tree};

#[derive(Debug)]
pub struct TextDocument {
    pub tree: Tree,
    pub contents: String,
    pub parse_result: ParseResult,
}

// ASTNodes are language dependent functions that can be used for gathering information on a language
// Extension on TreeSitter nodes to provide more convinent functions
pub trait ASTNodeExt {
    fn get_text(&self, contents: &str) -> String;
}

impl ASTNodeExt for Node<'_> {
    fn get_text(&self, contents: &str) -> String {
        let content = self.utf8_text(contents.as_bytes());
        if let Ok(cont) = content {
            return cont.replace('\"', "");
        }
        String::from("")
    }
}
