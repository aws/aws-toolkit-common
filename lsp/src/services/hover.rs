use tower_lsp::lsp_types::{Hover, HoverContents, HoverParams, MarkedString, Range};
use tree_sitter::Point;

use crate::{
    parsers::json_schema::utils::object::NodeIdentifier, utils::text_document::TextDocument,
};

pub fn hover(document: &TextDocument, params: HoverParams) -> Hover {
    let col = usize::try_from(params.text_document_position_params.position.character).unwrap();
    let line = usize::try_from(params.text_document_position_params.position.line).unwrap();
    let n = document
        .tree
        .root_node()
        .named_descendant_for_point_range(
            Point {
                column: col,
                row: line,
            },
            Point {
                column: col,
                row: line,
            },
        )
        .unwrap();

    let ident = NodeIdentifier::new(&n, &document.contents);
    let matches = &document.parse_result.schema_matches;
    if !matches.is_empty() {
        for schema_match in matches {
            if schema_match.node.closest_pair == ident.closest_pair
                && schema_match.schema.is_object()
                && schema_match
                    .schema
                    .as_object()
                    .unwrap()
                    .contains_key("description")
            {
                return Hover {
                    contents: HoverContents::Scalar(MarkedString::String(String::from(
                        schema_match.schema["description"].as_str().unwrap(),
                    ))),
                    range: Some(Range {
                        start: ident.start,
                        end: ident.end,
                    }),
                };
            }
        }
    }

    Hover {
        contents: HoverContents::Scalar(MarkedString::String(String::from(""))),
        range: Some(Range {
            start: ident.start,
            end: ident.end,
        }),
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        parsers::json_schema::{json_schema_parser::JSONSchemaValidator, utils::ir::parse},
        utils::text_document::TextDocument,
    };
    use serde_json::{json, Value};
    use tower_lsp::lsp_types::{
        Hover, HoverContents, HoverParams, MarkedString, Position, Range, TextDocumentIdentifier,
        TextDocumentPositionParams, WorkDoneProgressParams,
    };
    use url::Url;

    use super::hover;

    fn hover_test(contents: &str, schema: &Value, line: u32, character: u32) -> Hover {
        let tree = parse(contents);
        let validator = JSONSchemaValidator::new(schema.to_owned());
        let parse_result = validator.validate(&tree, contents);
        let document = TextDocument {
            tree,
            contents: contents.to_string(),
            parse_result,
        };
        let params = HoverParams {
            text_document_position_params: TextDocumentPositionParams {
                text_document: TextDocumentIdentifier {
                    uri: Url::parse("languageserver://test").unwrap(),
                },
                position: Position { line, character },
            },
            work_done_progress_params: WorkDoneProgressParams {
                ..Default::default()
            },
        };
        hover(&document, params)
    }

    #[allow(clippy::collapsible_match, clippy::assertions_on_constants)]
    fn test_hover_contents(hover: Hover, expected_range: Range, description: &str) {
        if let HoverContents::Scalar(marked_str) = hover.contents {
            if let MarkedString::String(str) = marked_str {
                assert_eq!(str, description);
                if let Some(found_range) = hover.range {
                    assert_eq!(expected_range, found_range);
                }
                return;
            }
        }
        assert!(false, "Expected string");
    }

    #[test]
    fn does_not_hover_if_no_description() {
        let schema = &json!({
            "properties": {
                "bar": {
                    "type": "object"
                }
            }
        });
        let contents = r#"{
    "bar": {

    }
}"#;
        let hovers_on_key = hover_test(contents, schema, 1, 9);
        test_hover_contents(
            hovers_on_key,
            Range::new(Position::new(1, 4), Position::new(3, 5)),
            "",
        );

        let hovers_on_parenthesis = hover_test(contents, schema, 1, 12);
        test_hover_contents(
            hovers_on_parenthesis,
            Range::new(Position::new(1, 11), Position::new(3, 5)),
            "",
        );
    }

    #[test]
    fn hovers_on_object() {
        let schema = &json!({
            "properties": {
                "bar": {
                    "type": "object",
                    "description": "test"
                }
            }
        });
        let contents = r#"{
    "bar": {

    }
}"#;
        let hovers_on_key = hover_test(contents, schema, 1, 9);
        test_hover_contents(
            hovers_on_key,
            Range::new(Position::new(1, 4), Position::new(3, 5)),
            "test",
        );

        let hovers_on_parenthesis = hover_test(contents, schema, 1, 12);
        test_hover_contents(
            hovers_on_parenthesis,
            Range::new(Position::new(1, 11), Position::new(3, 5)),
            "test",
        );
    }

    #[test]
    fn hovers_on_array() {
        let schema = &json!({
            "properties": {
                "foo": {
                    "type": "array",
                    "description": "my test description"
                }
            }
        });
        let contents = r#"{ 
    "foo": [

    ]
}"#;
        let hovers_on_key = hover_test(contents, schema, 1, 9);
        test_hover_contents(
            hovers_on_key,
            Range::new(Position::new(1, 4), Position::new(3, 5)),
            "my test description",
        );

        let hovers_on_square_bracket = hover_test(contents, schema, 1, 12);
        test_hover_contents(
            hovers_on_square_bracket,
            Range::new(Position::new(1, 11), Position::new(3, 5)),
            "my test description",
        );
    }

    #[test]
    fn hovers_on_integer() {
        let schema = &json!({
            "properties": {
                "foo": {
                    "type": "integer",
                    "description": "my foo test description"
                }
            }
        });
        let contents = r#"{
    "foo": 5
}"#;
        let hovers_on_integer_key = hover_test(contents, schema, 1, 5);
        test_hover_contents(
            hovers_on_integer_key,
            Range::new(Position::new(1, 5), Position::new(1, 8)),
            "my foo test description",
        );

        let hovers_on_integer_value = hover_test(contents, schema, 1, 11);
        test_hover_contents(
            hovers_on_integer_value,
            Range::new(Position::new(1, 11), Position::new(1, 12)),
            "my foo test description",
        );

        let hovers_on_integer_pair = hover_test(contents, schema, 1, 4);
        test_hover_contents(
            hovers_on_integer_pair,
            Range::new(Position::new(1, 4), Position::new(1, 9)),
            "my foo test description",
        );
    }

    #[test]
    fn hovers_on_string() {
        let schema = &json!({
            "properties": {
                "bar": {
                    "type": "string",
                    "description": "my string test description"
                }
            }
        });
        let contents = r#"{
    "bar": "bar"
}"#;
        let hovers_on_string_key = hover_test(contents, schema, 1, 7);
        test_hover_contents(
            hovers_on_string_key,
            Range::new(Position::new(1, 5), Position::new(1, 8)),
            "my string test description",
        );

        let hovers_on_string_value = hover_test(contents, schema, 1, 13);
        test_hover_contents(
            hovers_on_string_value,
            Range::new(Position::new(1, 12), Position::new(1, 15)),
            "my string test description",
        );

        let hovers_on_number_pair = hover_test(contents, schema, 1, 4);
        test_hover_contents(
            hovers_on_number_pair,
            Range::new(Position::new(1, 4), Position::new(1, 9)),
            "my string test description",
        );
    }

    #[test]
    fn hovers_on_boolean() {
        let schema = &json!({
            "properties": {
                "baz": {
                    "type": "boolean",
                    "description": "my boolean test description"
                }
            }
        });
        let contents = r#"{
    "baz": false
}"#;
        let hovers_on_boolean_key = hover_test(contents, schema, 1, 7);
        test_hover_contents(
            hovers_on_boolean_key,
            Range::new(Position::new(1, 5), Position::new(1, 8)),
            "my boolean test description",
        );

        let hovers_on_boolean_value = hover_test(contents, schema, 1, 13);
        test_hover_contents(
            hovers_on_boolean_value,
            Range::new(Position::new(1, 11), Position::new(1, 16)),
            "my boolean test description",
        );

        let hovers_on_boolean_pair = hover_test(contents, schema, 1, 4);
        test_hover_contents(
            hovers_on_boolean_pair,
            Range::new(Position::new(1, 4), Position::new(1, 9)),
            "my boolean test description",
        );
    }

    #[test]
    fn hovers_on_null() {
        let schema = &json!({
            "properties": {
                "foo": {
                    "type": "null",
                    "description": "my null test description"
                }
            }
        });
        let contents = r#"{
    "foo": null
}"#;
        let hovers_on_string_key = hover_test(contents, schema, 1, 7);
        test_hover_contents(
            hovers_on_string_key,
            Range::new(Position::new(1, 5), Position::new(1, 8)),
            "my null test description",
        );

        let hovers_on_string_value = hover_test(contents, schema, 1, 13);
        test_hover_contents(
            hovers_on_string_value,
            Range::new(Position::new(1, 11), Position::new(1, 15)),
            "my null test description",
        );

        let hovers_on_number_pair = hover_test(contents, schema, 1, 4);
        test_hover_contents(
            hovers_on_number_pair,
            Range::new(Position::new(1, 4), Position::new(1, 9)),
            "my null test description",
        );
    }
}
