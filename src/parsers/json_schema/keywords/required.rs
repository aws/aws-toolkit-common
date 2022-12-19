use std::collections::HashSet;

use serde_json::Value;
use tower_lsp::lsp_types::Diagnostic;
use itertools::Itertools;
use crate::{utils::tree_sitter::IRObject, parsers::json_schema::{utils::to_diagnostic, errors::required_error}};

pub fn validate_required(node: &IRObject, sub_schema: &Value) -> Option<Diagnostic> {
    let required_property = sub_schema.get("required");
    if required_property.is_none() {
        return None;
    }

    let required_values = required_property.unwrap().as_array();
    if required_values.is_none() {
        return None;
    }

    // get the hashset of all the requirements
    let mut requirements_hash = HashSet::new();
    for req in required_values.unwrap() {
        let potential_requirement = req.as_str();
        if potential_requirement.is_some() {
            println!("{}", potential_requirement.unwrap());
            requirements_hash.insert(potential_requirement.unwrap());
        }
    }

    // ensure that every requirement is in the properties
    for prop in &node.properties {
        let property = prop.key.contents.as_str();

        if requirements_hash.contains(property) {
            requirements_hash.remove(property);
        }
    }

    if !requirements_hash.is_empty() {
        let missing_requirements = requirements_hash.into_iter().collect::<Vec<&str>>().iter().join(", ");
        return Some(to_diagnostic(node.start, node.end, required_error(missing_requirements)));
    }

    return None;
}

// #[cfg(test)]
// mod tests {
//     use tower_lsp::lsp_types::Position;
//     use serde_json::json;
//     use crate::{utils::tree_sitter::{IRString, NodeTypes, IRObject, IRPair}};

//     use super::validate_required;

//     #[test]
//     fn required_ok() {
//         let schema = json!({
//             "required": ["name"]
//         });
//         let result = validate_required(&IRObject::new(
//                 vec![
//                     IRPair::new(
//                         IRString::new(
//                             String::from("name"),
//                             Position::new(0, 0),
//                             Position::new(0, 4)
//                         ),
//                         NodeTypes::IRString(IRString::new(
//                             String::from("test"),
//                             Position::new(0, 4),
//                             Position::new(0, 8)
//                         )),
//                         Position::new(0, 0),
//                         Position::new(0, 8)
//                     )
//                 ],
//                 Position::new(0, 0),
//                 Position::new(0, 8)
//             ),
//             schema
//         );

//         assert!(result.is_none())
//     }

//     #[test]
//     fn required_error() {
//         let schema = json!({
//             "required": ["name"]
//         });
//         let result = validate_required(&IRObject::new(
//                 vec![
//                     IRPair::new(
//                         IRString::new(
//                             String::from("notName"),
//                             Position::new(0, 0),
//                             Position::new(0, 4)
//                         ),
//                         NodeTypes::IRString(IRString::new(
//                             String::from("test"),
//                             Position::new(0, 4),
//                             Position::new(0, 8)
//                         )),
//                         Position::new(0, 0),
//                         Position::new(0, 8)
//                     )
//                 ],
//                 Position::new(0, 0),
//                 Position::new(0, 8)
//             ),
//         schema
//         );

//         // TODO make this test more robust
//         assert!(result.is_some())
//     }
    
//     #[test]
//     fn required_not_found() {
//         let schema = json!({
//             "notRequired": ["name"]
//         });
//         let result = validate_required(&IRObject::new(
//             vec![
//                 IRPair::new(
//                     IRString::new(
//                         String::from("test"),
//                         Position::new(0, 0),
//                         Position::new(0, 4)
//                     ),
//                     NodeTypes::IRString(IRString::new(
//                         String::from("test"),
//                         Position::new(0, 4),
//                         Position::new(0, 8)
//                     )),
//                     Position::new(0, 0),
//                     Position::new(0, 8)
//                 )
//             ],
//             Position::new(0, 0),
//             Position::new(0, 8)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }

//     #[test]
//     fn required_not_array() {
//         let schema = json!({
//             "required": "NAN"
//         });
//         let result = validate_required(&IRObject::new(
//             vec![
//                 IRPair::new(
//                     IRString::new(
//                         String::from("test"),
//                         Position::new(0, 0),
//                         Position::new(0, 4)
//                     ),
//                     NodeTypes::IRString(IRString::new(
//                         String::from("test"),
//                         Position::new(0, 4),
//                         Position::new(0, 8)
//                     )),
//                     Position::new(0, 0),
//                     Position::new(0, 8)
//                 )
//             ],
//             Position::new(0, 0),
//             Position::new(0, 8)
//         ),
//         schema
//         );
//         assert!(result.is_none())
//     }
// }
