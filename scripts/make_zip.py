import os
import zipfile
import shutil

def create_clean_zip():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_path = os.path.join(os.path.dirname(base_dir), "neuro-mesh.zip")
    
    exclude_dirs = {"node_modules", ".git", ".pytest_cache", "__pycache__"}
    exclude_exts = {".db", ".log", ".pyc"}

    print(f"Creating clean ZIP archive from {base_dir} -> {zip_path}...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(base_dir):
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in exclude_exts or file.endswith(".db"):
                    continue
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, base_dir)
                zf.write(full_path, rel_path)

    print(f"Zip created successfully: {zip_path} ({os.path.getsize(zip_path)} bytes)")

    # Copy to brain & scratch artifacts
    brain_zip = r"C:\Users\redha\.gemini\antigravity\brain\88a21007-0c1d-4d83-9be2-9f8bd2ce25a6\neuro-mesh.zip"
    scratch_zip = r"C:\Users\redha\.gemini\antigravity\scratch\neuro-mesh.zip"

    try:
        shutil.copy(zip_path, brain_zip)
        shutil.copy(zip_path, scratch_zip)
        print("[MAKE ZIP] Copied zip to artifact and scratch folders.")
    except Exception as e:
        print(f"[MAKE ZIP NOTICE] {e}")

if __name__ == "__main__":
    create_clean_zip()
