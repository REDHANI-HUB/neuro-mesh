import os
import json
import shutil
import numpy as np

try:
    import mne
except ImportError:
    mne = None

def setup_physionet_sample_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sample_dir = os.path.join(base_dir, "data", "sample")
    os.makedirs(sample_dir, exist_ok=True)

    # PhysioNet EDF paths downloaded via MNE
    mne_data_dir = os.path.expanduser(r"~\mne_data\MNE-eegbci-data\files\eegmmidb\1.0.0\S001")
    r04_edf = os.path.join(mne_data_dir, "S001R04.edf")
    r08_edf = os.path.join(mne_data_dir, "S001R08.edf")

    target_r04 = os.path.join(sample_dir, "S001R04.edf")
    target_r08 = os.path.join(sample_dir, "S001R08.edf")

    if os.path.exists(r04_edf) and not os.path.exists(target_r04):
        shutil.copy(r04_edf, target_r04)
        print(f"[DATASET SETUP] Copied real EDF: {target_r04}")

    if os.path.exists(r08_edf) and not os.path.exists(target_r08):
        shutil.copy(r08_edf, target_r08)
        print(f"[DATASET SETUP] Copied real EDF: {target_r08}")

    # Write metadata.json
    metadata = {
        "dataset_name": "PhysioNet EEG Motor Movement/Imagery Dataset (EEGMMIDB)",
        "source": "PhysioNet / National Institute of Neurological Disorders and Stroke (NINDS)",
        "url": "https://physionet.org/content/eegmmidb/1.0.0/",
        "subject": "S001",
        "runs": ["R04 (Left vs Right Hand Motor Imagery)", "R08 (Both Hands vs Feet Motor Imagery)"],
        "sampling_frequency_hz": 160.0,
        "n_channels": 64,
        "channel_names": [
            "Fc5", "Fc3", "Fc1", "Fcz", "Fc2", "Fc4", "Fc6", "C5", "C3", "C1",
            "Cz", "C2", "C4", "C6", "Cp5", "Cp3", "Cp1", "Cpz", "Cp2", "Cp4",
            "Cp6", "Fp1", "Fpz", "Fp2", "Af7", "Af3", "Afz", "Af4", "Af8", "F7",
            "F5", "F3", "F1", "Fz", "F2", "F4", "F6", "F8", "Ft7", "Ft8",
            "T7", "T8", "T9", "T10", "Tp7", "Tp8", "P7", "P5", "P3", "P1",
            "Pz", "P2", "P4", "P6", "P8", "Po7", "Po3", "Poz", "Po4", "Po8",
            "O1", "Oz", "O2", "Iz"
        ],
        "motor_imagery_classes": ["LEFT_HAND", "RIGHT_HAND", "REST"],
        "window_sec": 2.0,
        "n_samples_per_window": 1000,
        "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)"
    }

    metadata_path = os.path.join(sample_dir, "metadata.json")
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"[DATASET SETUP] Saved metadata to: {metadata_path}")

    # Extract real windows from EDF file using MNE if available
    sample_json_path = os.path.join(sample_dir, "eegmmidb_sample.json")
    if mne is not None and os.path.exists(target_r04):
        try:
            print(f"[DATASET SETUP] Extracting real EEG epochs from {target_r04}...")
            raw = mne.io.read_raw_edf(target_r04, preload=True, verbose=False)
            raw.resample(500, verbose=False)  # Resample to 500 Hz matching pipeline
            data = raw.get_data()  # shape (64, n_samples)
            n_ch, tot_s = data.shape
            win_s = 1000  # 2 seconds at 500 Hz

            events, event_id = mne.events_from_annotations(raw, verbose=False)
            event_map = {}
            for k, v in event_id.items():
                if "T0" in str(k): event_map[int(v)] = "REST"
                elif "T1" in str(k): event_map[int(v)] = "LEFT_HAND"
                elif "T2" in str(k): event_map[int(v)] = "RIGHT_HAND"

            samples = []
            idx = 0
            for ev in events:
                sample_idx = int(ev[0])
                ev_code = int(ev[2])
                label = event_map.get(ev_code, "REST")
                start = max(0, min(sample_idx, tot_s - win_s))
                window_data = np.array(data[:, start:start+win_s], dtype=float).tolist()

                samples.append({
                    "index": idx,
                    "label": label,
                    "data": window_data,
                    "window_start": int(start),
                    "window_end": int(start + win_s),
                    "source": "PhysioNet EEGMMIDB (S001R04.edf)"
                })
                idx += 1

            if samples:
                with open(sample_json_path, "w") as f:
                    json.dump(samples, f)
                print(f"[DATASET SETUP] Successfully created real dataset sample file with {len(samples)} real epochs: {sample_json_path}")
                return
        except Exception as e:
            print(f"[DATASET SETUP ERROR] Failed to process EDF file: {e}")

if __name__ == "__main__":
    setup_physionet_sample_data()
