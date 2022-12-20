use itertools::Itertools;
use std::collections::HashSet;

use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::{
        ir::IR,
        json_schema::{
            errors::unique_items_error,
            utils::{get_value, to_diagnostic},
        },
    },
    utils::text_document::ASTNodeExt,
    utils::tree_sitter::IRArray,
};

pub fn validate_unique_items(
    node: &IRArray,
    file_contents: &String,
    sub_schema: &Value,
) -> Option<Diagnostic> {
    let unique_items = sub_schema.get("uniqueItems")?.as_bool()?;

    if !unique_items {
        return None;
    }

    let mut duplicate_items = HashSet::new();
    let mut found_items = HashSet::new();

    for item in &node.items {
        let ir_node = IR::new(item.to_owned(), file_contents.to_string());
        if ir_node.is_none() {
            continue;
        }

        let val = get_value(ir_node.unwrap(), file_contents);
        if found_items.contains(&val) {
            duplicate_items.insert(item);
        }

        found_items.insert(val);
    }

    if !duplicate_items.is_empty() {
        // Get all the unique items
        let duplicates = duplicate_items
            .iter()
            .map(|node| node.get_text(file_contents))
            .join(", ");
        return Some(to_diagnostic(
            node.start,
            node.end,
            unique_items_error(duplicates),
        ));
    }

    None
}
