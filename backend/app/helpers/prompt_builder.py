# backend/app/helpers/prompt_builder.py
from typing import Any, List


def build_document_extraction_prompt(ocr_text: str, filename: str) -> str:
    return f"""You are a specialized medical record extraction engine for ParentPulse, an eldercare family health coordination app.
Analyze the following document text extracted from '{filename}'.

Extract structured healthcare information into valid JSON with this exact schema:
{{
  "document_type": "prescription" | "lab_report" | "radiology" | "discharge_summary" | "vaccination" | "hospital_bill" | "other",
  "doctor_name": string or null,
  "hospital_name": string or null,
  "document_date": "YYYY-MM-DD" or null,
  "extracted_fields": {{
      // For prescriptions: medicines list with dosage, frequency, instructions
      // For lab reports: test_name, result_value, reference_range, unit, status (normal/abnormal)
      // For bills: total_amount, currency, itemized_summary
  }},
  "summary": "Concise 2-3 sentence layman-friendly summary of the key findings or instructions.",
  "suggested_timeline_events": [
      {{
          "title": string,
          "event_type": "doctor_visit" | "diagnosis" | "medicine_started" | "lab_test" | "surgery" | "hospitalization" | "follow_up",
          "description": string,
          "event_date": "YYYY-MM-DD"
      }}
  ]
}}

STRICT RULES:
- Output ONLY valid JSON, no markdown code fence blocks if possible.
- Do not invent facts not present in the document.
- Never diagnose medical conditions or recommend new treatments.

Document text:
\"\"\"{ocr_text}\"\"\"
"""


def build_rag_grounded_prompt(query: str, parent_name: str, context_chunks: List[dict[str, Any]]) -> str:
    formatted_chunks = []
    for i, chunk in enumerate(context_chunks):
        formatted_chunks.append(
            f"--- Source [{i+1}] Title: {chunk.get('title', 'Unknown')} Date: {chunk.get('date', 'Unknown')} ---\n"
            f"{chunk.get('content', '')}\n"
        )
    context_str = "\n".join(formatted_chunks)

    return f"""You are ParentPulse AI, a compassionate and precise health information assistant for the family of {parent_name}.
Your job is to help adult children and family caregivers quickly understand stored medical history.

User Question: "{query}"

Authorized Health Records Context:
{context_str}

MANDATORY GUIDELINES:
1. Answer strictly using the authorized context provided above.
2. If the information is not present in the context, state clearly: "I cannot find this in the uploaded health records."
3. Cite the source documents where applicable (e.g. "[Source 1: Blood Test Report on 2026-08-10]").
4. DISCLAIMER: Never offer a medical diagnosis, suggest altering drug doses, or prescribe medications. Advise consulting the attending physician for clinical advice.
"""
