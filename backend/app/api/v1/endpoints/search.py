# backend/app/api/v1/endpoints/search.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.search import UniversalSearchQuery, UniversalSearchResponse, SearchResultItem
from app.schemas.common import ApiResponse
from app.helpers.response_builder import build_response
from app.crud.documents import DocumentRepository
from app.crud.medicines import MedicineRepository

router = APIRouter(prefix="/search", tags=["Universal Search"])


@router.post("", response_model=ApiResponse[UniversalSearchResponse])
async def search_health_records(
    query_body: UniversalSearchQuery,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    results = []
    if query_body.parent_id:
        doc_repo = DocumentRepository(session)
        docs = await doc_repo.search_documents(query_body.parent_id, query_body.query)
        for d in docs:
            results.append(
                SearchResultItem(
                    type="document",
                    id=str(d.id),
                    title=d.title,
                    subtitle=f"{d.document_type.capitalize()} • {d.doctor_name or 'Uploaded'}",
                    date=str(d.document_date),
                    metadata={"status": d.status, "summary": d.summary or ""},
                )
            )

        med_repo = MedicineRepository(session)
        meds = await med_repo.list_by_parent(query_body.parent_id, active_only=False)
        for m in meds:
            if query_body.query.lower() in m.name.lower() or (m.reason and query_body.query.lower() in m.reason.lower()):
                results.append(
                    SearchResultItem(
                        type="medicine",
                        id=str(m.id),
                        title=m.name,
                        subtitle=f"{m.dosage} • {m.instructions}",
                        date=str(m.start_date),
                        metadata={"is_active": m.is_active},
                    )
                )

    resp = UniversalSearchResponse(
        query=query_body.query,
        results=results,
        total_matches=len(results),
    )
    return build_response(resp)
