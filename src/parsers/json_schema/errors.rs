
pub fn additional_items_error(processed_items: usize, node_items: usize) -> String {
   return format!("The array should have {:#?} items or less. Found {:#?}", processed_items, node_items);
}

pub fn additional_properties_error(additional_property: String) -> String {
    return format!("!{:#?} was declared but shouldn't be", additional_property);
}

pub fn exclusive_maximum_error(expected: f64, found: f64) -> String {
    return format!("Value {:#?} was above the exclusive maximum of {:#?}", found, expected);
}

pub fn exclusive_minimum_error(expected: f64, found: f64) -> String {
    return format!("Value {:#?} was above the exclusive minimum of {:#?}", found, expected);
}

pub fn type_error(expected: String, found: String) -> String {
    return format!("Incorrect type. Expected {:#?} but found {:#?}", expected, found);
}

pub fn expected_items_error(expected: usize, found: usize) -> String {
    return format!("Expected {:#?} items but found {:#?}", expected, found);
}

pub fn expected_length_error(expected: usize, found: usize) -> String {
    return format!("Expected an item of length {:#?} but found {:#?}", expected, found);
}

pub fn expected_properties_error(expected: usize, found: usize) -> String {
    return format!("Expected {:#?} properties but found {:#?}", expected, found);
}

pub fn maximum_error(expected: f64, found: f64) -> String {
    return format!("Value {:#?} was above the maximum of {:#?}", expected, found);
}

pub fn minimum_error(expected: f64, found: f64) -> String {
    return format!("Value {:#?} was below the minimum of {:#?}", expected, found);
}

pub fn multiple_of_error(expected: f64, found: f64) -> String {
    return format!("{:#?} is not a multiple of {:#?}", found, expected);
}

pub fn pattern_error(expected: String, found: String) -> String {
    return format!("Expected {:#?} to match {:#?}", expected, found);
}

pub fn required_error(requirements: String) -> String {
    return format!("Missing the following requirements: {:#?}", requirements);
}

pub fn unique_items_error(duplicate_items: String) -> String {
    return format!("Found duplicate items: !{:#?}", duplicate_items);
}
