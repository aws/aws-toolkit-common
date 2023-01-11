use std::collections::HashMap;

use itertools::Itertools;
use regex::bytes::Regex;
use reqwest::Url;
use tower_lsp::lsp_types::{
    CodeAction, CodeActionKind, CodeActionOrCommand, CodeActionParams, CodeActionResponse,
    Diagnostic, NumberOrString, Range, TextEdit, WorkspaceEdit,
};

use crate::parsers::json_schema::keywords::json_enum::ENUM_CODE;

pub fn create_codeactions(params: CodeActionParams) -> Option<CodeActionResponse> {
    let mut actions = CodeActionResponse::new();

    if let Some(action) = enum_codeaction(&params.text_document.uri, params.context.diagnostics) {
        actions.push(CodeActionOrCommand::CodeAction(action));
    }

    Some(actions)
}

pub fn enum_codeaction(uri: &Url, diagnostics: Vec<Diagnostic>) -> Option<CodeAction> {
    let enum_diagnostics = diagnostics
        .iter()
        .filter(|p| p.code == Some(NumberOrString::String(ENUM_CODE.to_string())))
        .cloned() // Required, otherwise we get Vec<&Diagnostic>
        .collect_vec();
    if enum_diagnostics.is_empty() {
        return None;
    }

    let mut text_edits = Vec::new();
    for diag in &enum_diagnostics {
        if let Some(edit) = enum_conversion(&diag.message, diag.range) {
            text_edits.push(edit);
        }
    }
    let mut workspace_edits = HashMap::new();
    workspace_edits.insert(uri.to_owned(), text_edits);

    Some(CodeAction {
        command: None,
        data: None,
        diagnostics: Some(enum_diagnostics),
        disabled: None,
        edit: Some(WorkspaceEdit::new(workspace_edits)),
        is_preferred: Some(true),
        kind: Some(CodeActionKind::QUICKFIX),
        title: "Use suggested enum".to_string(),
    })
}

fn enum_conversion(message: &str, diagnostic_range: Range) -> Option<TextEdit> {
    let r = Regex::new(r#"^".*" must be "(.*)"$"#).unwrap();
    let captures = r.captures(message.as_bytes());
    match captures {
        Some(cap) => {
            if let Some(m) = cap.get(1) {
                let expected_text = std::str::from_utf8(m.as_bytes());
                if expected_text.is_err() {
                    return None;
                }

                return Some(TextEdit::new(
                    diagnostic_range,
                    expected_text.unwrap().to_string(),
                ));
            }
            None
        }
        None => None,
    }
}
