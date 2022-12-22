use std::sync::Arc;

use parsers::json_schema::json_schema_parser::JSONSchemaValidator;
use registry::parser_registry::{Registry, RegistryItem};
use serde_json::json;

pub mod parsers;
pub mod registry;
pub mod services;
pub mod utils;

pub fn buildspec_registry() -> RegistryItem {
    // We should technically de-dup the boxed function call since we can re-use that it in other places and a json schema validator should probably
    // only be allocated on the heap once, though we would technically have to dynamically pass in the schema since that can
    // change depending on the product
    RegistryItem::new(
        String::from("build.yaml"),
        Arc::new(|tree, file_contents| {
            Arc::new(JSONSchemaValidator::new(tree, json!({}), file_contents))
        }),
    )
}

pub fn build_registry() -> Registry {
    Registry::new(vec![buildspec_registry()])
}
