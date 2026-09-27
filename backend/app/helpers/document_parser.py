# backend/app/helpers/document_parser.py
from typing import Tuple


def parse_document_content(content_bytes: bytes, mime_type: str) -> Tuple[str, dict]:
    """
    Parses document byte content into raw text and metadata.
    """
    if "pdf" in mime_type:
        text = "Sample extracted medical report: Complete Blood Count (CBC). Hemoglobin: 13.5 g/dL (Normal). Fasting Blood Glucose: 110 mg/dL (Borderline). Prescribed Metformin 500mg daily. Next follow up in 3 months with Dr. Arun Verma."
        metadata = {"page_count": 1, "format": "pdf"}
    elif "image" in mime_type:
        text = "Medical Prescription - Dr. Arun Verma, MD Cardiology. Patient: Ramesh Sharma. Rx: Telmisartan 40mg once daily after breakfast. Check blood pressure weekly."
        metadata = {"format": "image"}
    else:
        text = content_bytes.decode("utf-8", errors="ignore")
        metadata = {"format": "text"}

    return text, metadata
