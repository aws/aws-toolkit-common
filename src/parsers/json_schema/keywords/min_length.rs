use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRString}, parsers::json_schema::{utils::to_diagnostic, errors::expected_items_error}};

pub fn validate_min_length(node: &IRString, sub_schema: &Value) -> Option<Diagnostic> {
    let min_length = sub_schema.get("minLength")?.as_i64()?.try_into().ok()?;
    let content_length = node.contents.len();

    if content_length < min_length {
        return Some(to_diagnostic(node.start, node.end, expected_items_error(content_length, min_length)));
    }

    return None;
}

#[cfg(test)]
mod tests {
    use tower_lsp::lsp_types::Position;
    use serde_json::json;
    use crate::{utils::tree_sitter::IRString};

    use super::validate_min_length;

    #[test]
    fn min_length_ok() {
        let schema = &json!({
            "minLength": 2
        });
        let result = validate_min_length(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );
        assert!(result.is_none())
    }

    #[test]
    fn min_length_error() {
        let schema = &json!({
            "minLength": 10
        });
        let result = validate_min_length(&IRString::new(
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
    fn min_length_not_found() {
        let schema = &json!({
            "notMinLength": 2
        });
        let result = validate_min_length(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );
        assert!(result.is_none())
    }

    #[test]
    fn min_length_not_number() {
        let schema = &json!({
            "minLength": "NAN"
        });
        let result = validate_min_length(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );
        assert!(result.is_none())
    }
}
