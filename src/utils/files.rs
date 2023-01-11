use std::fs::File;
use std::io::Write;

pub async fn download_file(url: &str, path: &str) -> std::io::Result<()> {
    let text = reqwest::get(url)
        .await
        .expect("Failed to download url")
        .text()
        .await
        .expect("Could not url content to text");
    let mut f = File::create(path)?;
    f.write_all(text.as_bytes())
        .unwrap_or_else(|_| panic!("Could not write bytes to {}", path));

    Ok(())
}
