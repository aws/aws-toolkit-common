// sub_schema can be the json schema interface

use regex::Regex;
use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{
    parsers::json_schema::{errors::pattern_error, utils::to_diagnostic},
    utils::tree_sitter::IRString,
};

pub fn validate_pattern(node: &IRString, sub_schema: &Value) -> Option<Diagnostic> {
    let pattern = sub_schema.get("pattern")?.as_str()?;

    let re = Regex::new(pattern).unwrap();
    if !re.is_match(node.contents.as_str()) {
        return Some(to_diagnostic(
            node.start,
            node.end,
            pattern_error(pattern.to_string(), node.contents.to_string()),
        ));
    }

    None
}
