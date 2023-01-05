use std::sync::Arc;

use tree_sitter::Tree;

use crate::parsers::parser::ParseResult;

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
        incoming_file_path: &str,
        tree: &Tree,
        file_contents: &str,
    ) -> Option<ParseResult> {
        for item in &self.registry_items {
            if (item.matches)(incoming_file_path) {
                return Some((item.parse)(tree, file_contents));
            }
        }
        None
    }
}

// Added by external projects e.g. buildspec, ecs tasks, etc to denote what incoming files should match and their backend
pub struct RegistryItem {
    matches: Matcher,
    parse: Parse,
}

type Matcher = Arc<dyn Fn(&str) -> bool + Send + Sync>;

type Parse = Arc<dyn Fn(&Tree, &str) -> ParseResult + Send + Sync>;

impl RegistryItem {
    pub fn new(matcher: Matcher, parse: Parse) -> Self {
        RegistryItem {
            matches: matcher,
            parse,
        }
    }
}
