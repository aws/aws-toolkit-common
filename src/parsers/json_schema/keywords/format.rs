use regex::Regex;
use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use std::{net::IpAddr, str::FromStr};
use addr::{psl::List, parser::{EmailAddress, DomainName}};
use url::Url;
use time::OffsetDateTime;

use crate::{utils::tree_sitter::IRString, parsers::json_schema::utils::to_diagnostic};

fn _validate_format(node: &IRString, error: &str, pattern: &str) -> Option<Diagnostic> {
    // TODO fix unsafe unwrap
    let reg = Regex::new(pattern).unwrap();
    if reg.is_match(&node.contents) {
        return Some(to_diagnostic(node.start, node.end, error.to_string()));
    }
    return None;
}

pub fn validate_format(node: &IRString, sub_schema: &Value) -> Option<Diagnostic> {
    let format = sub_schema.get("format")?.as_str()?;

    match format {
        "uri" => {
            let parse = Url::parse(&node.contents);
            if parse.is_err() {
                return Some(to_diagnostic(node.start, node.end, String::from("Not a uri")));
            }
            return None;
        },
        "date-time" => {
            let parse = OffsetDateTime::parse(&node.contents, &time::format_description::well_known::Rfc3339);
            if parse.is_err() {
                return Some(to_diagnostic(node.start, node.end, String::from("Not a date-time")));
            }
            return None;
        },
        "email" => {
            let parse = List.parse_email_address(&node.contents);
            if parse.is_err() {
                return Some(to_diagnostic(node.start, node.end, String::from("Not an email address")));
            }
            return None;
        },
        "hostname" => {
            let parse = List.parse_domain_name(&node.contents);
            if parse.is_err() {
                return Some(to_diagnostic(node.start, node.end, String::from("Not a hostname")));
            }
            return None;
        },
        "ipv4" => {
            let addr = IpAddr::from_str(&node.contents);
            if addr.is_err() || (addr.is_ok() && !addr.unwrap().is_ipv4()){
                return Some(to_diagnostic(node.start, node.end, String::from("Not an ipv4 address")));
            }
            return None;
        },
        "ipv6" => {
            let addr = IpAddr::from_str(&node.contents);
            if addr.is_err() || (addr.is_ok() && !addr.unwrap().is_ipv6()){
                return Some(to_diagnostic(node.start, node.end, String::from("Not an ipv6 address")));
            }
            return None;
        },
        _ => {
            return None;
        }
    }
}
