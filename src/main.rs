use awsdocuments_language_server::activate;
use awsdocuments_language_server::registry::parser_registry::Registry;
use awsdocuments_language_server::services::completion::completion;
use awsdocuments_language_server::services::hover::hover;
use awsdocuments_language_server::utils::text_document::TextDocument;
use dashmap::DashMap;
use tower_lsp::jsonrpc::Result;
use tower_lsp::lsp_types::*;
use tower_lsp::{Client, LanguageServer, LspService, Server};
use tree_sitter::Tree;

struct Backend {
    client: Client,
    registry: Registry,
    documents: DashMap<String, TextDocument>,
}

impl Backend {
    // Called when the document is opened and the document is
    async fn on_change(&self, params: &TextDocumentItem) {
        let mut parser = tree_sitter::Parser::new();
        parser
            .set_language(tree_sitter_json::language())
            .expect("Error loading json grammar");

        let tree: Tree = if self.documents.contains_key(&params.uri.to_string()) {
            let doc = self.documents.get(&params.uri.to_string()).unwrap();
            parser.parse(&params.text, Some(&doc.tree)).unwrap()
        } else {
            parser.parse(&params.text, None).unwrap()
        };

        let parse = self
            .registry
            .parse(params.uri.to_string(), tree.clone(), params.text.clone());

        if let Some(parse_result) = parse {
            self.client
                .publish_diagnostics(
                    params.uri.clone(),
                    parse_result.errors.clone(),
                    Some(params.version),
                )
                .await;

            self.documents.insert(
                params.uri.to_string(),
                TextDocument {
                    tree,
                    contents: params.text.clone(),
                    parse_result,
                },
            );
        }
    }
}

#[tower_lsp::async_trait]
impl LanguageServer for Backend {
    async fn initialize(&self, _: InitializeParams) -> Result<InitializeResult> {
        Ok(InitializeResult {
            server_info: None, // TODO if we want to make the server version easily identifiable on the client side
            capabilities: ServerCapabilities {
                text_document_sync: Some(TextDocumentSyncCapability::Kind(
                    TextDocumentSyncKind::FULL, // TODO we probably want to change this to incremental once we can easily support that
                )),
                completion_provider: None,
                hover_provider: Some(HoverProviderCapability::Simple(true)),
                ..ServerCapabilities::default() // currently don't support workspace folders but those could be added later
            },
        })
    }

    async fn initialized(&self, _: InitializedParams) {
        self.client
            .log_message(MessageType::INFO, "initialized")
            .await;
    }

    async fn did_change_configuration(&self, _: DidChangeConfigurationParams) {
        self.client
            .log_message(MessageType::INFO, "did_change_configuration")
            .await;
    }

    async fn did_open(&self, params: DidOpenTextDocumentParams) {
        self.client.log_message(MessageType::INFO, "did_open").await;
        self.on_change(&TextDocumentItem {
            uri: params.text_document.uri,
            text: params.text_document.text,
            version: params.text_document.version,
            language_id: params.text_document.language_id,
        })
        .await;
    }

    async fn did_change(&self, mut params: DidChangeTextDocumentParams) {
        self.client
            .log_message(MessageType::INFO, "did_change")
            .await;
        let test = std::mem::take(&mut params.content_changes[0].text); // We currently only support full document syncing so the entire document gets sent each time
        self.on_change(&TextDocumentItem {
            uri: params.text_document.uri,
            text: test, // TODO file cache of all the items
            version: params.text_document.version,
            language_id: String::new(), // TODO language id
        })
        .await;
    }

    async fn completion(&self, params: CompletionParams) -> Result<Option<CompletionResponse>> {
        self.client
            .log_message(MessageType::INFO, "completion")
            .await;
        let tree = self
            .documents
            .get(&params.text_document_position.text_document.uri.to_string())
            .unwrap();
        let completion_result = completion(tree.value(), params);
        let result = Some(CompletionResponse::Array(completion_result));
        return Ok(result);
    }

    async fn hover(&self, params: HoverParams) -> Result<Option<Hover>> {
        self.client.log_message(MessageType::INFO, "hover").await;
        let tree = self
            .documents
            .get(
                &params
                    .text_document_position_params
                    .text_document
                    .uri
                    .to_string(),
            )
            .unwrap();
        let hover_result = hover(tree.value(), params);
        return Ok(Some(hover_result));
    }

    async fn shutdown(&self) -> Result<()> {
        Ok(())
    }
}

#[tokio::main]
async fn main() {
    let stdin = tokio::io::stdin();
    let stdout = tokio::io::stdout();

    let registry = activate().await;

    let (service, socket) = LspService::new(|client| Backend {
        client,
        documents: DashMap::new(),
        registry,
    });

    Server::new(stdin, stdout, socket).serve(service).await
}
