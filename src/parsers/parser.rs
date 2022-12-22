use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;

use super::json_schema::utils::object::NodeIdentifier;

pub trait Parser {
    fn parse(&self) -> ParseResult;
}

#[derive(Clone, Debug)]
pub struct ParseResult {
    pub errors: Vec<Diagnostic>,
    pub schema_matches: Vec<SchemaMatches>,
}

#[derive(Clone, Debug)]
pub struct SchemaMatches {
    pub node: NodeIdentifier,
    pub schema: Value,
}

impl Default for ParseResult {
    fn default() -> Self {
        Self::new(Vec::new(), Vec::new())
    }
}

impl ParseResult {
    pub fn new(errors: Vec<Diagnostic>, schema_matches: Vec<SchemaMatches>) -> Self {
        ParseResult {
            errors,
            schema_matches,
        }
    }

    pub fn merge(self, val: ParseResult) -> Self {
        ParseResult {
            errors: [self.errors, val.errors].concat(),
            schema_matches: [self.schema_matches, val.schema_matches].concat(),
        }
    }

    pub fn merge_all(self, val: Vec<ParseResult>) -> Self {
        let mut errors = Vec::new();
        let mut schemas = Vec::new();
        for mut v in val {
            errors.append(&mut v.errors);
            schemas.append(&mut v.schema_matches);
        }
        ParseResult {
            errors: [self.errors, errors].concat(),
            schema_matches: [self.schema_matches, schemas].concat(),
        }
    }
}
