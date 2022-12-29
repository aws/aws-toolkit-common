use serde_json::{Number, Value};

// TODO rename, replace with trait
// Make this more secure. Technically this will panic if the i64 cant be converted into the f64
pub fn convert_i64_to_float(num: i64) -> f64 {
    num as f64
}

#[derive(Clone)]
pub enum JsonNumbers<'a> {
    Number(&'a Number),
    Value(&'a Value),
}

impl JsonNumbers<'_> {
    fn is_i64(&self) -> bool {
        match self {
            JsonNumbers::Number(num) => num.is_i64(),
            JsonNumbers::Value(num) => num.is_i64(),
        }
    }

    fn as_i64(&self) -> Option<i64> {
        match self {
            JsonNumbers::Number(num) => num.as_i64(),
            JsonNumbers::Value(num) => num.as_i64(),
        }
    }

    fn is_f64(&self) -> bool {
        match self {
            JsonNumbers::Number(num) => num.is_f64(),
            JsonNumbers::Value(num) => num.is_f64(),
        }
    }

    fn as_f64(&self) -> Option<f64> {
        match self {
            JsonNumbers::Number(num) => num.as_f64(),
            JsonNumbers::Value(num) => num.as_f64(),
        }
    }

    pub fn get_number(&self) -> Option<f64> {
        if self.is_i64() {
            return Some(convert_i64_to_float(self.as_i64()?));
        }

        if self.is_f64() {
            return self.as_f64();
        }

        None
    }
}
