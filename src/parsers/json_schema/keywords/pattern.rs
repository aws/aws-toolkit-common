
// sub_schema can be the json schema interface

use serde_json::Value;
use regex::Regex;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRString}, parsers::json_schema::{utils::to_diagnostic, errors::pattern_error}};

pub fn validate_pattern(node: &IRString, sub_schema: &Value) -> Option<Diagnostic> {
    let pattern = sub_schema.get("pattern")?.as_str()?;

    let re = Regex::new(pattern).unwrap();
    if !re.is_match(node.contents.as_str()) {
        return Some(to_diagnostic(node.start, node.end, pattern_error(pattern.to_string(), node.contents.to_string())))
    }

    return None;
}
