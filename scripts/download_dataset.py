import os
import sys

def download_physionet_data():
    """
    Download a subset of the PhysioNet EEG Motor Movement/Imagery Dataset (eegmmidb).
    Subject 1, Runs [4, 8, 12] (Motor Imagery: Left Hand vs Right Hand).
    """
    print("[DATASET DOWNLOADER] Initializing PhysioNet EEG Dataset Download...")
    try:
        import mne
        target_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "physionet")
        os.makedirs(target_dir, exist_ok=True)
        
        print(f"[DATASET DOWNLOADER] Target Directory: {target_dir}")
        print("[DATASET DOWNLOADER] Fetching EDF files for Subject 1 (Runs 4, 8, 12)...")
        raw_fnames = mne.datasets.eegbci.load_data(1, [4, 8, 12], path=target_dir)
        print(f"[DATASET DOWNLOADER] Successfully downloaded {len(raw_fnames)} EDF files:")
        for fname in raw_fnames:
            print(f"  - {fname}")
        print("[DATASET DOWNLOADER] PhysioNet EEG Dataset ready for Mode B execution!")
    except ImportError:
        print("[ERROR] MNE package is not installed. Install via `pip install mne` to download PhysioNet EDF dataset.")
    except Exception as e:
        print(f"[ERROR] PhysioNet dataset download failed: {e}")

if __name__ == "__main__":
    download_physionet_data()
