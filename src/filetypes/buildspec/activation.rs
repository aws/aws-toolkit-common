use std::{env, fs, sync::Arc};

use serde_json::Value;

use crate::{
    parsers::json_schema::json_schema_parser::JSONSchemaValidator,
    registry::parser_registry::{Registry, RegistryItem},
    utils::files::download_file,
};

const SCHEMA_URL: &str =
    "http://d2t8thmxo9c3sa.cloudfront.net/CodeBuild/buildspec/buildspec-v2.schema.json";

const SCHEMA_PATH: &str = "buildspec.schema.json";

pub async fn activate(registry: &mut Registry<'static>) {
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

    // TODO make this read the schema in once
    let buildspec_registry = RegistryItem::new(
        "build.json",
        Arc::new(|tree, file_contents| {
            let schema_file = fs::read_to_string(SCHEMA_PATH).expect("Could not read file");
            let schema: Value = serde_json::from_str(&schema_file)
                .expect("Should have been able to read the string");
            Arc::new(JSONSchemaValidator::new(tree, schema, file_contents))
        }),
    );

    registry.add(buildspec_registry);
}
