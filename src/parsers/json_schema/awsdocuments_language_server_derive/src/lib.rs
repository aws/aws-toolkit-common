extern crate proc_macro;

use std::{fs, str::FromStr};
use quote::quote;
use glob::glob;
use proc_macro2::TokenStream;
use regex::Regex;
use syn::{
    braced,
    parse_macro_input,
    Token,
    LitStr,
    parse::{Parse, ParseStream}, ItemFn
};

struct JsonTestSuiteWrapperInput {
    json_schema_test_suite_path: String,
    draft: String,
    include_tests_regex: Vec<Regex>
}

impl Parse for JsonTestSuiteWrapperInput {
    fn parse(input: ParseStream) -> Result<Self, syn::Error> {
        let json_schema_test_suite_path: String = input.parse::<LitStr>()?.value();
        
        // Consume the comma
        let _: syn::token::Comma = input.parse()?;

        let draft: String = input.parse::<LitStr>()?.value();

        // Consume the comma
        let _: syn::token::Comma = input.parse()?;

        let include_tests_regex: Vec<Regex> = {
            let included_tests = {
                let braced_content;
                braced!(braced_content in input);
                let res: syn::punctuated::Punctuated<LitStr, Token![,]> = braced_content.parse_terminated(|v| v.parse())?;
                res
            };
            included_tests
                .iter()
                .filter_map(|content| Regex::new(&format!("^{}$", content.value())).ok())
                .collect::<Vec<Regex>>()
        };

        return Ok(JsonTestSuiteWrapperInput {
            json_schema_test_suite_path,
            draft,
            include_tests_regex
        });
    }
}

/**
 * Get the test paths that we can pass into the generate_json_schema_tests macro.
 * If a third attribute is defined, those tests will be included.
 * If the third element is a vector of regex then include those
 * otherwise include all the tests for the given draft
 */
fn get_test_paths(input: JsonTestSuiteWrapperInput) -> Vec<TokenStream> {
    // get tests

    let root_path = &(input.json_schema_test_suite_path + &input.draft);
    let test_path = root_path.to_string() + "/**/*.json";
    let paths = glob(&test_path).expect("Failed to read glob pattern");
    let mut test_suite_paths = Vec::new();
  
    for path in paths {
        if path.is_ok() {

            // TODO make these calls safer
            let file_path = &path.unwrap().to_str().unwrap().to_string();
            let contents = fs::read_to_string(file_path).expect("file was not found");
            let json = json::parse(&contents).unwrap();

            for (suite_num, el) in json.members().into_iter().enumerate() {
                let tests = el["tests"].members();
                for (test_num, _) in tests.into_iter().enumerate() {
                    let path_dir = root_path.to_string() + "/";
                    let test_name = file_path.replace(&path_dir, "").replace(".json", "").replace("/", "_").replace("-", "_");

                    let final_test_name = format!("{}_{}_{}", test_name, suite_num, test_num);

                    let mut found = false;
                    for reg in &input.include_tests_regex {
                        if reg.is_match(&final_test_name) {
                            found = true;
                        }
                    }

                    if !found {
                        test_suite_paths.push(TokenStream::from_str(&format!("\"{}\"", final_test_name)).unwrap());
                        continue;
                    }
                }
            }
        }
    }
    return test_suite_paths;
}

#[proc_macro_attribute]
pub fn json_schema_test_suite_include(attr: proc_macro::TokenStream, item: proc_macro::TokenStream) -> proc_macro::TokenStream {
    let input = parse_macro_input!(attr as JsonTestSuiteWrapperInput);
    let item_fn = parse_macro_input!(item as ItemFn);

    let paths = get_test_paths(input);
    
    let gen = quote! {
        #[json_schema_test_suite(
            "src/parsers/json_schema/test_suite",
            "draft4",
            {
                #(#paths),*
            }
        )]
        #item_fn
    };
    return gen.into();
}
