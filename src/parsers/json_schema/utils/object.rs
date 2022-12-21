use crate::parsers::json_schema::json_schema_parser::Validation;

pub struct Properties {
    pub keys_used: Vec<String>,
    pub validation: Vec<Validation>,
}
