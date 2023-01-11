use std::{env, fs, sync::Arc};

use regex::Regex;
use serde_json::Value;

use crate::{
    parsers::json_schema::json_schema_parser::JSONSchemaValidator,
    registry::parser_registry::{Registry, RegistryItem},
    utils::files::download_file,
};

const SCHEMA_URL: &str =
    "http://d2t8thmxo9c3sa.cloudfront.net/CodeBuild/buildspec/buildspec-v2.schema.json";

const SCHEMA_PATH: &str = "buildspec.schema.json";
const BUILDSPEC_FILE_NAME: &str = "build.json";

pub async fn activate(registry: &mut Registry) {
    // Download the schema if its not downloaded

    // TODO make this a path that can be configurable by the language client
    // that way editors can link to where files are stored on disk
    // currently it just writes to the path where the language client is opened
    let schema_location = env::current_dir()
        .expect("Buildspec schema needs current directory")
        .join(SCHEMA_PATH);

    let path_test = schema_location.try_exists();
    if path_test.is_err() || (path_test.is_ok() && !path_test.unwrap()) {
        download_file(SCHEMA_URL, SCHEMA_PATH)
            .await
            .expect("Unable to download buildspec schema");
    }

    let schema_file = fs::read_to_string(SCHEMA_PATH).expect("Could not read file");
    let schema: Value =
        serde_json::from_str(&schema_file).expect("Should have been able to read the string");

    let val = JSONSchemaValidator::new(schema);

    // TODO make this read the schema in once
    let buildspec_registry = RegistryItem::new(
        Arc::new(|file_name, _tree| {
            let reg = Regex::new(BUILDSPEC_FILE_NAME);
            if reg.is_err() {
                return false;
            }
            reg.unwrap().is_match(file_name)
        }),
        Arc::new(move |tree, file_contents| val.validate(tree, file_contents)),
    );

    registry.add(buildspec_registry);
}
