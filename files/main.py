from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import cv2
import json
import urllib.request
from pathlib import Path

app = FastAPI(title="FaceID API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model paths ───────────────────────────────────────────────────────────────
MODELS_DIR = Path("models")
MODELS_DIR.mkdir(exist_ok=True)

DETECTOR_MODEL   = MODELS_DIR / "face_detection_yunet_2023mar.onnx"
RECOGNIZER_MODEL = MODELS_DIR / "face_recognition_sface_2021dec.onnx"

DETECTOR_URL   = "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx"
RECOGNIZER_URL = "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx"

# ── Download models if missing ────────────────────────────────────────────────
def download_model(url: str, path: Path):
    if not path.exists():
        print(f"Downloading {path.name} ...")
        urllib.request.urlretrieve(url, path)
        print(f"  done: {path.name}")

download_model(DETECTOR_URL, DETECTOR_MODEL)
download_model(RECOGNIZER_URL, RECOGNIZER_MODEL)

# ── Load models ───────────────────────────────────────────────────────────────
detector   = cv2.FaceDetectorYN.create(str(DETECTOR_MODEL), "", (320, 320), 0.6, 0.3, 5000)
recognizer = cv2.FaceRecognizerSF.create(str(RECOGNIZER_MODEL), "")

# ── Storage ───────────────────────────────────────────────────────────────────
STORAGE_FILE = Path("faces.json")

def load_faces() -> dict:
    if STORAGE_FILE.exists():
        with open(STORAGE_FILE) as f:
            data = json.load(f)
        return {k: np.array(v, dtype=np.float32) for k, v in data.items()}
    return {}

def save_faces(faces: dict):
    with open(STORAGE_FILE, "w") as f:
        json.dump({k: v.tolist() for k, v in faces.items()}, f)

stored_faces: dict = load_faces()

# ── Helpers ───────────────────────────────────────────────────────────────────
def decode_image(image_bytes: bytes) -> np.ndarray:
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(400, "Invalid image")
    return img

def get_embedding(img: np.ndarray) -> np.ndarray:
    h, w = img.shape[:2]
    detector.setInputSize((w, h))
    _, faces = detector.detect(img)
    if faces is None or len(faces) == 0:
        raise HTTPException(422, "No face detected — make sure your face is clearly visible")
    face = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)[0]
    aligned = recognizer.alignCrop(img, face)
    return recognizer.feature(aligned).flatten().astype(np.float32)

def to_pct(score: float) -> float:
    return round(min(max((score / 0.6) * 100, 0), 100), 1)

def cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
    return float(recognizer.match(a.reshape(1, -1), b.reshape(1, -1), cv2.FaceRecognizerSF_FR_COSINE))

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "status": "ok",
        "model": "SFace via OpenCV — ArcFace-grade",
        "stored_faces": len(stored_faces)
    }

@app.post("/store")
async def store_face(name: str, file: UploadFile = File(...)):
    img = decode_image(await file.read())
    embedding = get_embedding(img)
    stored_faces[name] = embedding
    save_faces(stored_faces)
    return {"success": True, "name": name, "embedding_dim": len(embedding), "total_stored": len(stored_faces)}

@app.post("/verify")
async def verify_face(file: UploadFile = File(...), threshold: float = 0.363):
    if not stored_faces:
        raise HTTPException(404, "No faces stored yet — store a face first")
    img = decode_image(await file.read())
    embedding = get_embedding(img)
    results = {name: cosine_sim(embedding, emb) for name, emb in stored_faces.items()}
    best_name = max(results, key=results.get)
    best_score = results[best_name]
    matched = best_score >= threshold
    return {
        "matched": matched,
        "name": best_name if matched else None,
        "confidence": to_pct(best_score),
        "raw_score": round(best_score, 4),
        "threshold": threshold,
        "all_scores": {k: to_pct(v) for k, v in results.items()}
    }

@app.post("/compare")
async def compare_two(file1: UploadFile = File(...), file2: UploadFile = File(...), threshold: float = 0.363):
    emb1 = get_embedding(decode_image(await file1.read()))
    emb2 = get_embedding(decode_image(await file2.read()))
    score = cosine_sim(emb1, emb2)
    return {"matched": score >= threshold, "confidence": to_pct(score), "raw_score": round(score, 4)}

@app.get("/faces")
def list_faces():
    return {"faces": list(stored_faces.keys()), "count": len(stored_faces)}

@app.delete("/faces/{name}")
def delete_face(name: str):
    if name not in stored_faces:
        raise HTTPException(404, f"'{name}' not found")
    del stored_faces[name]
    save_faces(stored_faces)
    return {"success": True, "deleted": name}

@app.delete("/faces")
def clear_all():
    stored_faces.clear()
    save_faces(stored_faces)
    return {"success": True, "message": "All faces cleared"}



# ══════════════════════════════════════════════════════════════════════════════
#  COMPANY OWNERSHIP VERIFICATION — Strict Document Analysis Engine
#  1. Reads each uploaded PDF using PyMuPDF
#  2. Extracts ALL text from each document
#  3. Searches for the EXACT expected identifier in each document
#  4. ALL 3 documents must contain their expected number → VERIFIED
#  5. If ANY single document fails → ENTIRE verification FAILS
# ══════════════════════════════════════════════════════════════════════════════
import re
import fitz  # PyMuPDF

COMPANIES_DB = Path("companies_db.json")

def load_companies() -> list:
    if COMPANIES_DB.exists():
        with open(COMPANIES_DB) as f:
            return json.load(f).get("companies", [])
    return []


def extract_text_from_file(file_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
        return text
    except Exception:
        return ""


def normalize(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip().upper()


def find_number_in_text(text: str, expected_number: str) -> dict:
    text_norm = normalize(text)
    expected = expected_number.strip().upper()
    text_compact = re.sub(r'[\s\-]', '', text_norm)
    expected_compact = re.sub(r'[\s\-]', '', expected)
    exact = expected in text_norm
    compact = expected_compact in text_compact
    found = exact or compact
    return {
        "found": found,
        "expectedNumber": expected_number,
        "exactMatch": exact,
        "textExtracted": len(text.strip()) > 0,
        "textLength": len(text),
    }


def find_name_in_text(text: str, name: str) -> bool:
    text_norm = normalize(text)
    name_norm = normalize(name)
    if name_norm in text_norm:
        return True
    words = [w for w in name_norm.split() if len(w) > 2]
    return sum(1 for w in words if w in text_norm) / max(len(words), 1) >= 0.8


# ── Regex patterns for auto-extracting identifiers from PDFs ──────────────────
CIN_PATTERN  = re.compile(r'\b([UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6})\b')
GST_PATTERN  = re.compile(r'\b(\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b')
PAN_PATTERN  = re.compile(r'\b([A-Z]{5}\d{4}[A-Z])\b')
UDYAM_PATTERN = re.compile(r'\b(UDYAM-[A-Z]{2}-\d{2}-\d{7})\b')

def extract_identifiers_from_text(text: str) -> dict:
    """Extract all business identifiers from document text using regex."""
    text_upper = normalize(text)
    cins = list(set(CIN_PATTERN.findall(text_upper)))
    gsts = list(set(GST_PATTERN.findall(text_upper)))
    pans_raw = list(set(PAN_PATTERN.findall(text_upper)))
    udyams = list(set(UDYAM_PATTERN.findall(text.upper())))
    # Filter PANs that are substrings of GSTs
    pans = [p for p in pans_raw if not any(p in g for g in gsts)]
    if not pans and gsts:
        pans = [g[2:12] for g in gsts]
    # Extract company names — look for "XXXX PRIVATE LIMITED"
    pvt = re.compile(r'([A-Z][A-Z ]+(?:PRIVATE LIMITED|PVT\.? ?LTD\.?))')
    raw_names = [n.strip() for n in pvt.findall(text_upper) if len(n.strip()) > 15
             and not n.strip().startswith(('CONSTITUTION', 'GOVERNMENT', 'MINISTRY', 'CERTIFICATE'))]
    # Clean: remove common prefixes that aren't part of the company name
    clean_names = []
    junk_prefixes = ['LEGAL NAME ', 'NAME OF ENTERPRISE ', 'TRADE NAME ', 'CERTIFY THAT ', 'I HEREBY CERTIFY THAT ']
    for name in raw_names:
        cleaned = name
        for prefix in junk_prefixes:
            if cleaned.startswith(prefix):
                cleaned = cleaned[len(prefix):]
        cleaned = cleaned.strip()
        if len(cleaned) > 10:
            clean_names.append(cleaned)
    return {"cin": cins, "gst": gsts, "pan": pans, "udyam": udyams, "companyNames": list(set(clean_names))}


@app.post("/extract-documents")
async def extract_documents(
    business_cert: UploadFile = File(...),
    gst_cert: UploadFile = File(...),
    company_id: UploadFile = File(...),
):
    """
    Extract identifiers from 3 uploaded PDFs and return them for auto-filling the form.
    Does NOT verify — just reads and extracts.
    """
    doc1_text = extract_text_from_file(await business_cert.read())
    doc2_text = extract_text_from_file(await gst_cert.read())
    doc3_text = extract_text_from_file(await company_id.read())

    doc1_ids = extract_identifiers_from_text(doc1_text)
    doc2_ids = extract_identifiers_from_text(doc2_text)
    doc3_ids = extract_identifiers_from_text(doc3_text)

    # Merge all found identifiers across all 3 documents
    all_cins = list(set(doc1_ids["cin"] + doc2_ids["cin"] + doc3_ids["cin"]))
    all_gsts = list(set(doc1_ids["gst"] + doc2_ids["gst"] + doc3_ids["gst"]))
    all_pans = list(set(doc1_ids["pan"] + doc2_ids["pan"] + doc3_ids["pan"]))
    all_udyams = list(set(doc1_ids["udyam"] + doc2_ids["udyam"] + doc3_ids["udyam"]))
    all_names = list(set(doc1_ids["companyNames"] + doc2_ids["companyNames"] + doc3_ids["companyNames"]))

    return {
        "success": True,
        "extracted": {
            "companyName": all_names[0] if all_names else "",
            "cin": all_cins[0] if all_cins else "",
            "gst": all_gsts[0] if all_gsts else "",
            "pan": all_pans[0] if all_pans else "",
            "udyam": all_udyams[0] if all_udyams else "",
        },
        "allFound": {
            "cins": all_cins,
            "gsts": all_gsts,
            "pans": all_pans,
            "udyams": all_udyams,
            "companyNames": all_names,
        },
        "perDocument": {
            "business_registration": {"filename": business_cert.filename, "textExtracted": bool(doc1_text.strip()), "identifiers": doc1_ids},
            "gst_certificate": {"filename": gst_cert.filename, "textExtracted": bool(doc2_text.strip()), "identifiers": doc2_ids},
            "certificate_of_incorporation": {"filename": company_id.filename, "textExtracted": bool(doc3_text.strip()), "identifiers": doc3_ids},
        },
    }


@app.get("/companies")
def list_companies():
    return {"companies": [c["companyName"] for c in load_companies()], "count": len(load_companies())}


@app.post("/verify-documents")
async def verify_documents(
    business_cert: UploadFile = File(...),
    gst_cert: UploadFile = File(...),
    company_id: UploadFile = File(...),
):
    companies = load_companies()
    if not companies:
        return {"verified": False, "message": "No companies in registry database"}

    doc1_text = extract_text_from_file(await business_cert.read())
    doc2_text = extract_text_from_file(await gst_cert.read())
    doc3_text = extract_text_from_file(await company_id.read())

    if not doc1_text.strip() and not doc2_text.strip() and not doc3_text.strip():
        return {"verified": False, "message": "FAILED: Could not extract text from any document."}

    best = None

    for company in companies:
        biz = company.get("businessRegistration", {})
        gst = company.get("gstCertificate", {})
        inc = company.get("incorporationCertificate", {})
        name = company.get("companyName", "")
        pan = company.get("pan", "")

        d1 = find_number_in_text(doc1_text, biz.get("number", ""))
        d2 = find_number_in_text(doc2_text, gst.get("number", ""))
        d3 = find_number_in_text(doc3_text, inc.get("number", ""))
        d2_pan = find_number_in_text(doc2_text, pan) if pan else {"found": False}

        d1_pass = d1["found"]
        d2_pass = d2["found"]
        d3_pass = d3["found"]
        all_pass = d1_pass and d2_pass and d3_pass
        count = sum([d1_pass, d2_pass, d3_pass])

        result = {
            "verified": all_pass,
            "companyName": name,
            "passedDocuments": count,
            "totalDocuments": 3,
            "percentage": round((count / 3) * 100),
            "documents": {
                "business_registration": {
                    "filename": business_cert.filename,
                    "passed": d1_pass,
                    "textExtracted": d1["textExtracted"],
                    "expectedNumber": biz.get("number", ""),
                    "expectedType": biz.get("type", "CIN"),
                    "numberFound": d1["found"],
                    "companyNameFound": find_name_in_text(doc1_text, name),
                },
                "gst_certificate": {
                    "filename": gst_cert.filename,
                    "passed": d2_pass,
                    "textExtracted": d2["textExtracted"],
                    "expectedNumber": gst.get("number", ""),
                    "expectedType": gst.get("type", "GSTIN"),
                    "numberFound": d2["found"],
                    "panFound": d2_pan.get("found", False),
                    "companyNameFound": find_name_in_text(doc2_text, name),
                },
                "certificate_of_incorporation": {
                    "filename": company_id.filename,
                    "passed": d3_pass,
                    "textExtracted": d3["textExtracted"],
                    "expectedNumber": inc.get("number", ""),
                    "expectedType": inc.get("type", "UDYAM"),
                    "numberFound": d3["found"],
                    "companyNameFound": find_name_in_text(doc3_text, name),
                },
            },
            "companyDetails": {
                "companyName": name,
                "address": company.get("address"),
                "type": company.get("type"),
                "dateOfIncorporation": company.get("dateOfIncorporation"),
            },
        }

        if best is None or count > best["passedDocuments"]:
            best = result

    if not best:
        return {"verified": False, "message": "No companies in registry"}

    if best["verified"]:
        best["message"] = f"VERIFIED: All 3 documents match {best['companyName']}. Ownership confirmed."
    else:
        failed = []
        for k, v in best["documents"].items():
            if not v["passed"]:
                label = k.replace("_", " ").title()
                if not v["textExtracted"]:
                    failed.append(f"{label}: Cannot read document")
                else:
                    failed.append(f"{label}: {v['expectedType']} {v['expectedNumber']} NOT FOUND")
        best["message"] = f"REJECTED: {len(failed)} document(s) failed. " + " | ".join(failed)

    return best


@app.post("/verify-company")
async def verify_company(cin: str = "", gst: str = "", pan: str = ""):
    companies = load_companies()
    if not companies:
        return {"verified": False, "message": "No companies in registry"}
    cin, gst, pan = cin.strip().upper(), gst.strip().upper(), pan.strip().upper()
    for company in companies:
        db_cin = company.get("businessRegistration", {}).get("number", "").upper()
        db_gst = company.get("gstCertificate", {}).get("number", "").upper()
        db_pan = company.get("pan", "").upper()
        cin_ok = cin == db_cin if cin else False
        gst_ok = gst == db_gst if gst else False
        pan_ok = pan == db_pan if pan else False
        matched = sum([cin_ok, gst_ok, pan_ok])
        total = sum([bool(cin), bool(gst), bool(pan)])
        if matched > 0:
            verified = matched == total and total >= 2
            return {"verified": verified, "message": "All matched!" if verified else f"{matched}/{total} matched"}
    return {"verified": False, "message": "No match found"}
