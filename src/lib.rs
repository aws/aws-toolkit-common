use filetypes::buildspec::activation::activate as buildspec_activation;
use registry::parser_registry::Registry;

pub mod filetypes;
pub mod parsers;
pub mod registry;
pub mod services;
pub mod utils;

// Activate any external modules
pub async fn activate() -> Registry {
    let mut registry = Registry::default();

    // TODO figure out a way for this to lazily complete. Technically, we don't need to block language server start until all of these are done
    // we can probably lazily-load the schemas, etc (perhaps status bar message saying downloading? like vscode-java) and then validate once it loads

    // Setup the buildspec json schema activations. Buildspec support will not be activated if schema fails to download or any other error occurs during activation
    buildspec_activation(&mut registry).await;

    registry
}

#[cfg(test)]
mod tests {
    use tree_sitter::Tree;

    use crate::activate;

    fn parse(text: String) -> Tree {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(tree_sitter_json::language())
            .expect("Error loading json grammar");
        parser.parse(text, None).unwrap()
    }

    #[tokio::test]
    async fn buildspec_registry_smoke_test() {
        let contents = r#"{
    "version": "2.0"
}"#;
        let tree = parse(contents.to_string());
        let res = activate()
            .await
            .parse("build.json".to_string(), tree, contents.to_string());
        if let Some(r) = res {
            assert_eq!(r.schema_matches.len(), 2);
        }
        panic!("Expected a valid parse result");
    }
}
