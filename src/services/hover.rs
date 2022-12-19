use tower_lsp::{lsp_types::{Hover, HoverContents, MarkedString, Range, HoverParams}};
use tree_sitter::{Point};

use crate::utils::text_document::TextDocument;

pub fn hover(document: &TextDocument, params: HoverParams) -> Hover {
    let col =  usize::try_from(params.text_document_position_params.position.character).unwrap();
    let line =  usize::try_from(params.text_document_position_params.position.line).unwrap();
    let n = document.tree.root_node().named_descendant_for_point_range(Point {
        column: col,
        row: line
    }, Point {
        column: col,
        row: line
    }).unwrap();
    
    let node_val = n.utf8_text(document.contents.as_bytes()).unwrap();
    // let symbol_node = registry.symbol_table.get(node_val);
    // if symbol_node.is_some() {
    //     return Hover {
    //         contents: HoverContents::Scalar(MarkedString::from_markdown(String::from(symbol_node.unwrap().description))),
    //         range: Some(Range {
    //             ..Default::default()
    //         })
    //     };
    // }
    return Hover {
       contents: HoverContents::Scalar(MarkedString::String(String::from(""))),
       range: Some(Range {
            ..Default::default()
       })
    };
    
}
