use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::{utils::tree_sitter::{IRString}, parsers::json_schema::{utils::to_diagnostic, errors::expected_items_error}};

pub fn validate_max_length(node: &IRString, sub_schema: &Value) -> Option<Diagnostic> {
    let max_length = sub_schema.get("maxLength")?.as_i64()?.try_into().ok()?;
    let content_length = node.contents.len();

    if content_length > max_length {
        return Some(to_diagnostic(node.start, node.end, expected_items_error(content_length, max_length)));
    }

    return None;
}

#[cfg(test)]
mod tests {
    use tower_lsp::lsp_types::Position;
    use serde_json::json;
    use crate::{utils::tree_sitter::IRString};

    use super::validate_max_length;

    #[test]
    fn max_length_ok() {
        let schema = &json!({
            "minLength": 2
        });
        let result = validate_max_length(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );
        assert!(result.is_none())
    }

    #[test]
    fn max_length_error() {
        let schema = &json!({
            "maxLength": 2
        });
        let result = validate_max_length(&IRString::new(
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
    fn max_length_not_found() {
        let schema = &json!({
            "notMaxLength": 2
        });
        let result = validate_max_length(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );
        assert!(result.is_none())
    }

    #[test]
    fn max_length_not_number() {
        let schema = &json!({
            "maxLength": "NAN"
        });
        let result = validate_max_length(&IRString::new(
            String::from("test"),
            Position::new(0, 0),
            Position::new(0, 4)
        ),
        schema
        );
        assert!(result.is_none())
    }
}
