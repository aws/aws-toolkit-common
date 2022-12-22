use tower_lsp::lsp_types::{CompletionItem, CompletionParams};
use tree_sitter::Point;

use crate::utils::text_document::ASTNodeExt;
use crate::utils::text_document::TextDocument;

pub fn completion(document: &TextDocument, params: CompletionParams) -> Vec<CompletionItem> {
    let col = usize::try_from(params.text_document_position.position.character).unwrap();
    let line = usize::try_from(params.text_document_position.position.line).unwrap();

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

    n.get_text(&document.contents);

    let mut rets: Vec<CompletionItem> = Vec::new();
    // If the parent is document? then we at the root level

    // When we are autocompleting something in the root level (with nothing pre-typed), that will always be a document

    // notes: When there is currently no items in the document e.g. { } you'll get an object node
    // when you try and auto complete after you have a node in the document e.g. { "AWSTemplateFormatVersion": "2010" } you'll get document node

    // we are at the top of the document

    // This is the inside of the where you're autocompleting. e.g. if you are autocompletion "resources": { <- here } the object will be type Object
    // and the parent will be "resources": {} with type pair. The first child of that pair will be "resources"

    // What if we had a dynamic trait on the smithy documents, that if its present in the found node
    // it will allow teams e.g. cfn, buildspec, etc to add in dynamic resources?
    // e.g. aws.documents#dynamic="file??"

    let node_val = n.get_text(&document.contents);
    rets.push(CompletionItem::new_simple(node_val, n.kind().to_string()));

    let node_val2 = n
        .parent()
        .unwrap()
        .child(0)
        .unwrap()
        .utf8_text(document.contents.as_bytes())
        .unwrap();
    rets.push(CompletionItem::new_simple(
        node_val2.to_string(),
        n.parent().unwrap().child(0).unwrap().kind().to_string(),
    ));

    rets
}

// TODO calculate indent sizes so we know how much to indent each bracket
// fn format_insert_text_json(symbol_key: &String, symbol_value: &CloudFormationNode) -> String {
//     let default_val = if symbol_value.val.is_some() { symbol_value.val.unwrap() } else {""};
//     match symbol_value.node_type {
//         NodeType::StringNode => return format!("\"{}\": \"{}\"", symbol_key, default_val),
//         NodeType::ObjectNode => return format!("\"{}\": {{\n\n}}", symbol_key)
//     }
// }

#[cfg(test)]
mod tests {
    use crate::{services::completion::completion, utils::text_document::TextDocument};
    use tower_lsp::lsp_types::{
        CompletionContext, CompletionItem, CompletionParams, CompletionTriggerKind,
        PartialResultParams, Position, TextDocumentIdentifier, TextDocumentPositionParams,
        WorkDoneProgressParams,
    };
    use tree_sitter::Tree;
    use url::Url;

    fn parse(text: String) -> Tree {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(tree_sitter_json::language())
            .expect("Error loading json grammar");
        parser.parse(text, None).unwrap()
    }

    fn completion_test(contents: &str, line: u32, ch: u32) -> Vec<CompletionItem> {
        let parse_result = parse(contents.to_string());
        let document = TextDocument {
            tree: parse_result,
            contents: contents.to_string(),
            parse_result: None,
        };
        let params = CompletionParams {
            context: Some(CompletionContext {
                trigger_kind: CompletionTriggerKind::INVOKED,
                trigger_character: Some("".to_string()),
            }),
            partial_result_params: PartialResultParams {
                ..Default::default()
            },
            work_done_progress_params: WorkDoneProgressParams {
                ..Default::default()
            },
            text_document_position: TextDocumentPositionParams {
                text_document: TextDocumentIdentifier {
                    uri: Url::parse("languageserver://test").unwrap(),
                },
                position: Position {
                    line,
                    character: ch,
                },
            },
        };
        completion(&document, params)
    }

    #[test]
    fn root_completion() {
        let result = completion_test(
            "{

}", 1, 4,
        );
        assert_eq!(result.len(), 9);
    }

    #[test]
    fn root_completion_no_duplicates_1() {
        let result = completion_test(
            "{
    \"AWSTemplateFormatVersion\": \"2010-09-09\",

}",
            2,
            4,
        );
        assert_eq!(result.len(), 8);
    }

    #[test]
    fn root_completion_no_duplicates() {
        let result = completion_test(
            "{
    \"AWSTemplateFormatVersion\": \"2010-09-09\",
    \"Description\": \"0.2.0\",
    \"Mappings\": {

    },
    \"Resources\": {

    },

}",
            9,
            4,
        );
        assert_eq!(result.len(), 5);
    }

    #[test]
    fn resource_completion() {
        let result = completion_test(
            "{
    \"AWSTemplateFormatVersion\": \"2010-09-09\",
    \"Description\": \"0.2.0\",
    \"Mappings\": {

    },
    \"Resources\": {

    }
}",
            7,
            8,
        );
        assert_eq!(result.len(), 5);
    }
}
