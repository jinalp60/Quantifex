import os
import shutil
import subprocess
import zipfile

# Configuration
LAYER_NAME = "custom-dependencies.zip"
S3_BUCKET = "quantifex-lambdas"
DEPENDENCIES = [
    "yfinance",
    "psycopg2-binary",
    "finnhub-python",
    "joblib"
]

# These are provided by the AWSSDKPandas layer, so we exclude them to save space
EXCLUDE_PACKAGES = ["pandas", "numpy", "boto3", "botocore", "s3fs", "pyarrow", "pip", "setuptools"]

def build_layer():
    print(f"--- Starting build for {LAYER_NAME} ---")
    
    # 1. Setup build directory
    build_dir = "layer_build"
    python_dir = os.path.join(build_dir, "python")
    
    if os.path.exists(build_dir):
        shutil.rmtree(build_dir)
    os.makedirs(python_dir)
    
    # 2. Install dependencies (Linux-compatible)
    # Since Lambda runs on Linux, we force the platform to manylinux for Windows compatibility
    print(f"Installing dependencies to {python_dir}...")
    try:
        subprocess.check_call([
            "pip", "install", 
            "--platform", "manylinux2014_x86_64",
            "--target", python_dir,
            "--only-binary=:all:", 
            "--python-version", "3.9",
            "--upgrade"
        ] + DEPENDENCIES)
    except subprocess.CalledProcessError as e:
        print(f"Error during pip install: {e}")
        return

    # 2.5 Remove excluded packages to save space
    print(f"Removing redundant packages: {EXCLUDE_PACKAGES}...")
    for package in EXCLUDE_PACKAGES:
        # Check for both the package folder and its .dist-info/ .egg-info
        for item in os.listdir(python_dir):
            if item.lower().startswith(package.lower()):
                item_path = os.path.join(python_dir, item)
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)

    # 3. Create Zip file
    print(f"Creating ZIP archive: {LAYER_NAME}...")
    with zipfile.ZipFile(LAYER_NAME, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(build_dir):
            for file in files:
                # We want the path inside the zip to start with 'python/'
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, build_dir)
                zf.write(full_path, rel_path)

    # 4. Upload to S3
    print(f"Uploading to s3://{S3_BUCKET}/{LAYER_NAME}...")
    try:
        subprocess.check_call([
            "aws", "s3", "cp", LAYER_NAME, f"s3://{S3_BUCKET}/{LAYER_NAME}"
        ])
    except subprocess.CalledProcessError as e:
        print(f"Error during S3 upload: {e}")
        return

    # 5. Cleanup
    print("Cleaning up...")
    shutil.rmtree(build_dir)
    if os.path.exists(LAYER_NAME):
        os.remove(LAYER_NAME)
        
    print(f"--- Successfully deployed {LAYER_NAME} ---")

if __name__ == "__main__":
    build_layer()
