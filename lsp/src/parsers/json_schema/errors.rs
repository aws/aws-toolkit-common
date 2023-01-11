pub fn additional_items_error(processed_items: usize, node_items: usize) -> String {
    format!(
        "The array should have {:#?} items or less. Found {:#?}",
        processed_items, node_items
    )
}

pub fn additional_properties_error(additional_property: &str) -> String {
    format!("!{:#?} was declared but shouldn't be", additional_property)
}

pub fn exclusive_maximum_error(expected: f64, found: f64) -> String {
    format!(
        "Value {:#?} was above the exclusive maximum of {:#?}",
        found, expected
    )
}

pub fn exclusive_minimum_error(expected: f64, found: f64) -> String {
    format!(
        "Value {:#?} was below the exclusive minimum of {:#?}",
        found, expected
    )
}

pub fn enum_error(expected: &Vec<String>, found: String) -> String {
    if expected.len() > 1 {
        format!("{:#?} must be one of {:#?}", found, expected.join(", "))
    } else {
        format!("{:#?} must be {:#?}", found, expected[0])
    }
}

pub fn type_error(expected: &str, found: &str) -> String {
    format!(
        "Incorrect type. Expected {:#?} but found {:#?}",
        expected, found
    )
}

pub fn expected_items_error(expected: usize, found: usize) -> String {
    format!("Expected {:#?} items but found {:#?}", expected, found)
}

pub fn expected_length_error(expected: usize, found: usize) -> String {
    format!(
        "Expected an item of length {:#?} but found {:#?}",
        expected, found
    )
}

pub fn expected_properties_error(expected: usize, found: usize) -> String {
    format!("Expected {:#?} properties but found {:#?}", expected, found)
}

pub fn maximum_error(expected: f64, found: f64) -> String {
    format!(
        "Value {:#?} was above the maximum of {:#?}",
        found, expected
    )
}

pub fn minimum_error(expected: f64, found: f64) -> String {
    format!(
        "Value {:#?} was below the minimum of {:#?}",
        found, expected
    )
}

pub fn multiple_of_error(expected: f64, found: f64) -> String {
    format!("{:#?} is not a multiple of {:#?}", found, expected)
}

pub fn pattern_error(expected: &str, found: &str) -> String {
    format!("Expected {:#?} to match {:#?}", expected, found)
}

pub fn required_error(requirements: &str) -> String {
    format!("Missing the following requirements: {:#?}", requirements)
}

pub fn unique_items_error(duplicate_items: &str) -> String {
    format!("Found duplicate items: !{:#?}", duplicate_items)
}
