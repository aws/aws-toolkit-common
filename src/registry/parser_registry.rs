use std::sync::Arc;

use regex::Regex;
use tree_sitter::Tree;

use crate::parsers::parser::{ParseResult, Parser};

#[derive(Default)]
pub struct Registry {
    registry_items: Vec<RegistryItem>,
}

impl Registry {
    pub fn add(&mut self, item: RegistryItem) {
        self.registry_items.push(item);
    }

    pub fn parse(
        &self,
        incoming_file_path: String,
        tree: Tree,
        file_contents: String,
    ) -> Option<ParseResult> {
        for item in &self.registry_items {
            let pattern = Regex::new(&item.file_match_pattern);
            if let Ok(reg) = pattern {
                if reg.is_match(&incoming_file_path) {
                    return Some((item.parse)(tree, file_contents).parse());
                }
            }
        }
        None
    }
}

// Added by external projects e.g. buildspec, ecs tasks, etc to denote what incoming files should match and their backend
pub struct RegistryItem {
    file_match_pattern: String,
    parse: Arc<dyn Fn(Tree, String) -> Arc<dyn Parser> + Send + Sync>,
}

impl RegistryItem {
    pub fn new(
        file_match_pattern: String,
        parse: Arc<dyn Fn(Tree, String) -> Arc<dyn Parser> + Send + Sync>,
    ) -> Self {
        RegistryItem {
            file_match_pattern,
            parse,
        }
    }
}
