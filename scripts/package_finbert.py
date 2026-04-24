import os
import tarfile
import urllib.request

def download_file(url, dest):
    print(f"Downloading {url}...")
    try:
        urllib.request.urlretrieve(url, dest)
    except Exception as e:
        print(f"Failed to download {url}: {e}")
        raise e

def package_finbert():
    base_url = "https://huggingface.co/ProsusAI/finbert/resolve/main/"
    files_to_download = [
        "config.json",
        "pytorch_model.bin",
        "vocab.txt",
        "tokenizer_config.json",
        "special_tokens_map.json"
    ]
    
    export_path = "finbert_model"
    output_filename = "model.tar.gz"

    if not os.path.exists(export_path):
        os.makedirs(export_path)

    print("--- Downloading FinBERT Weights (Standard Lib Only) ---")
    for file_name in files_to_download:
        url = base_url + file_name
        dest = os.path.join(export_path, file_name)
        download_file(url, dest)

    print(f"--- Packaging into {output_filename} ---")
    with tarfile.open(output_filename, "w:gz") as tar:
        for file_name in files_to_download:
            full_path = os.path.join(export_path, file_name)
            tar.add(full_path, arcname=file_name)
            print(f"Added: {file_name}")

    print(f"\nSuccess! '{output_filename}' is ready.")
    print(f"Next Step: aws s3 cp {output_filename} s3://quantifex-models-v1/finbert/{output_filename}")

if __name__ == "__main__":
    package_finbert()
