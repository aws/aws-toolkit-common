
// sub_schema can be the json schema interface

use serde_json::Value;
use regex::Regex;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRString}, parsers::json_schema::{utils::to_diagnostic, errors::pattern_error}};

pub fn validate_pattern(node: &IRString, sub_schema: &Value) -> Option<Diagnostic> {
    let pattern = sub_schema.get("pattern");
    if pattern.is_none() {
        return None;
    }

    let pattern_value = pattern.unwrap().as_str();
    if pattern_value.is_none() {
        return None;
    }

    let re = Regex::new(pattern_value.unwrap()).unwrap();
    if !re.is_match(node.contents.as_str()) {
        return Some(to_diagnostic(node.start, node.end, pattern_error(node.contents.to_string(), pattern_value.unwrap().to_string())))
    }

    return None;
}

#[cfg(test)]
mod tests {
    use tower_lsp::lsp_types::Position;
    use serde_json::json;
    use crate::{utils::tree_sitter::IRString};

    use super::validate_pattern;

    #[test]
    fn pattern_ok() {
        let schema = &json!({
            "pattern": "^test$"
        });
        let result = validate_pattern(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );
        assert!(result.is_none())
    }

    #[test]
    fn pattern_error() {
        let schema = &json!({
            "pattern": "^fail$"
        });
        let result = validate_pattern(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );

        // TODO make this test more robust
        assert!(result.is_some())
    }
    
    #[test]
    fn pattern_not_found() {
        let schema = &json!({
            "notPattern": "^test$"
        });
        let result = validate_pattern(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );
        assert!(result.is_none())
    }

    #[test]
    fn pattern_not_string() {
        let schema = &json!({
            "pattern": false
        });
        let result = validate_pattern(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );
        assert!(result.is_none())
    }
}
