use std::fs::File;
use std::io::Write;

pub async fn download_file(url: &str, path: &str) -> std::io::Result<()> {
    // TODO handle the errors in this correctly
    let text = reqwest::get(url)
        .await
        .expect("Failed to download url")
        .text()
        .await
        .expect("Could not convert to text");
    let mut f = File::create(path)?;
    f.write_all(text.as_bytes()).expect("Could not write bytes");

    Ok(())
}
