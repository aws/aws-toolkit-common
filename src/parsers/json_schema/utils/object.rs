use crate::parsers::parser::ParseResult;

pub struct Properties {
    pub keys_used: Vec<String>,
    pub validation: Vec<ParseResult>,
}
