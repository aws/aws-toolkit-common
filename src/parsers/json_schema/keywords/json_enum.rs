use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use crate::parsers::{
    ir::IR,
    json_schema::{
        errors::enum_error,
        utils::ir::{get_value, is_equal, to_diagnostic},
    },
};

pub fn validate_enum(node: &IR, file_contents: &String, sub_schema: &Value) -> Option<Diagnostic> {
    let enums = sub_schema.get("enum")?.as_array()?;

    let mut found_match = false;
    let mut enum_options = Vec::new();
    for e in enums {
        if is_equal(node, file_contents, e) {
            found_match = true;
        }

        enum_options.push(e.to_string());
    }

    if !found_match {
        let value = get_value(node.clone(), file_contents);

        // TODO anti-pattern? we probably shouldn't be using clone here
        // TODO kinda hacky supporting the debug attribute through JSONValues to get this
        return Some(to_diagnostic(
            node.clone().get_start(),
            node.clone().get_end(),
            enum_error(enum_options, format!("{:#?}", value)),
        ));
    }

    None
}
