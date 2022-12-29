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
    // TODO test that the correct range is returned from these tests. Will be easier when we hook this up to VSCode

    use crate::{
        parsers::{json_schema::json_schema_parser::JSONSchemaValidator, parser::Parser},
        utils::text_document::TextDocument,
    };
    use serde_json::{json, Value};
    use tower_lsp::lsp_types::{
        Hover, HoverContents, HoverParams, MarkedString, Position, TextDocumentIdentifier,
        TextDocumentPositionParams, WorkDoneProgressParams,
    };
    use tree_sitter::Tree;
    use url::Url;

    use super::hover;

    fn parse(text: &str) -> Tree {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(tree_sitter_json::language())
            .expect("Error loading json grammar");
        parser.parse(text, None).unwrap()
    }

    fn hover_test(contents: &str, schema: &Value, line: u32, character: u32) -> Hover {
        let tree = parse(contents);
        let parse_result =
            JSONSchemaValidator::new(tree.to_owned(), schema.to_owned(), contents.to_string())
                .parse();
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
    fn test_hover_contents(contents: HoverContents, description: &str) {
        if let HoverContents::Scalar(marked_str) = contents {
            if let MarkedString::String(str) = marked_str {
                assert_eq!(str, description);
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
        test_hover_contents(hovers_on_key.contents, "");

        let hovers_on_parenthesis = hover_test(contents, schema, 1, 12);
        test_hover_contents(hovers_on_parenthesis.contents, "");
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
        test_hover_contents(hovers_on_key.contents, "test");

        let hovers_on_parenthesis = hover_test(contents, schema, 1, 12);
        test_hover_contents(hovers_on_parenthesis.contents, "test");
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
        test_hover_contents(hovers_on_key.contents, "my test description");

        let hovers_on_square_bracket = hover_test(contents, schema, 1, 12);
        test_hover_contents(hovers_on_square_bracket.contents, "my test description");
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
        test_hover_contents(hovers_on_integer_key.contents, "my foo test description");

        let hovers_on_integer_value = hover_test(contents, schema, 1, 11);
        test_hover_contents(hovers_on_integer_value.contents, "my foo test description");

        let hovers_on_integer_pair = hover_test(contents, schema, 1, 4);
        test_hover_contents(hovers_on_integer_pair.contents, "my foo test description");
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
        test_hover_contents(hovers_on_string_key.contents, "my string test description");

        let hovers_on_string_value = hover_test(contents, schema, 1, 13);
        test_hover_contents(
            hovers_on_string_value.contents,
            "my string test description",
        );

        let hovers_on_number_pair = hover_test(contents, schema, 1, 4);
        test_hover_contents(hovers_on_number_pair.contents, "my string test description");
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
            hovers_on_boolean_key.contents,
            "my boolean test description",
        );

        let hovers_on_boolean_value = hover_test(contents, schema, 1, 13);
        test_hover_contents(
            hovers_on_boolean_value.contents,
            "my boolean test description",
        );

        let hovers_on_boolean_pair = hover_test(contents, schema, 1, 4);
        test_hover_contents(
            hovers_on_boolean_pair.contents,
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
        let hovers_on_string_key = hover_test(contents, &schema, 1, 7);
        test_hover_contents(hovers_on_string_key.contents, "my null test description");

        let hovers_on_string_value = hover_test(contents, &schema, 1, 13);
        test_hover_contents(hovers_on_string_value.contents, "my null test description");

        let hovers_on_number_pair = hover_test(contents, &schema, 1, 4);
        test_hover_contents(hovers_on_number_pair.contents, "my null test description");
    }
}
