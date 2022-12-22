use tower_lsp::lsp_types::{Hover, HoverContents, HoverParams, MarkedString, Range};
use tree_sitter::Point;

use crate::utils::text_document::TextDocument;

pub fn hover(document: &TextDocument, params: HoverParams) -> Hover {
    let col = usize::try_from(params.text_document_position_params.position.character).unwrap();
    let line = usize::try_from(params.text_document_position_params.position.line).unwrap();
    let _n = document
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

    if let Some(matches) = &document.parse_result {
        if !matches.schema_matches.is_empty() {}
    }

    Hover {
        contents: HoverContents::Scalar(MarkedString::String(String::from(""))),
        range: Some(Range {
            ..Default::default()
        }),
    }
}
