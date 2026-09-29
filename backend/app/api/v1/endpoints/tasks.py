# backend/app/api/v1/endpoints/tasks.py
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user, get_db, get_parent_access_context
from app.core.concurrency import enforce_record_version
from app.core.exceptions import AuthorizationError, ResourceNotFoundError
from app.core.permissions import verify_family_membership, verify_parent_access
from app.helpers.response_builder import build_response
from app.models.task import Task
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["Care Tasks"])


@router.post("", response_model=ApiResponse[TaskResponse])
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    parent, _ = await verify_parent_access(session, current_user.id, data.parent_id)
    if parent.family_id != data.family_id:
        raise AuthorizationError("The task family does not match the selected parent.")
    if data.assigned_to_user_id:
        await verify_family_membership(session, data.assigned_to_user_id, parent.family_id)
    task = Task(
        id=data.id,
        parent_id=data.parent_id,
        family_id=data.family_id,
        title=data.title,
        description=data.description,
        priority=data.priority.value if hasattr(data.priority, "value") else str(data.priority),
        status="pending",
        due_date=data.due_date,
        assigned_to_user_id=data.assigned_to_user_id,
        created_by=current_user.id,
    )
    session.add(task)
    await session.flush()
    await session.refresh(task)
    return build_response(TaskResponse.model_validate(task))


@router.get("/parent/{parent_id}", response_model=ApiResponse[list[TaskResponse]])
async def list_parent_tasks(
    parent_id: UUID,
    status_filter: str | None = Query(None, alias="status"),
    context=Depends(get_parent_access_context),
    session: AsyncSession = Depends(get_db),
):
    stmt = select(Task).where(Task.parent_id == parent_id)
    if status_filter:
        stmt = stmt.where(Task.status == status_filter)
    stmt = stmt.order_by(Task.created_at.desc())
    res = await session.execute(stmt)
    tasks = list(res.scalars().all())
    return build_response([TaskResponse.model_validate(t) for t in tasks])


@router.patch("/{task_id}", response_model=ApiResponse[TaskResponse])
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    record_version: str | None = Header(None, alias="X-Record-Version"),
    conflict_resolution: str | None = Header(None, alias="X-Conflict-Resolution"),
):
    stmt = select(Task).where(Task.id == task_id)
    res = await session.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise ResourceNotFoundError("Task", task_id)
    await verify_parent_access(session, current_user.id, task.parent_id)
    enforce_record_version(task.updated_at, record_version, conflict_resolution)

    if data.title is not None:
        task.title = data.title
    if data.description is not None:
        task.description = data.description
    if data.priority is not None:
        task.priority = data.priority.value if hasattr(data.priority, "value") else str(data.priority)
    if data.status is not None:
        task.status = data.status.value if hasattr(data.status, "value") else str(data.status)
    if data.due_date is not None:
        task.due_date = data.due_date
    if data.assigned_to_user_id is not None:
        await verify_family_membership(session, data.assigned_to_user_id, task.family_id)
        task.assigned_to_user_id = data.assigned_to_user_id

    await session.flush()
    await session.refresh(task)
    return build_response(TaskResponse.model_validate(task))


@router.delete("/{task_id}")
async def delete_task(
    task_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
    record_version: str | None = Header(None, alias="X-Record-Version"),
    conflict_resolution: str | None = Header(None, alias="X-Conflict-Resolution"),
):
    stmt = select(Task).where(Task.id == task_id)
    task = (await session.execute(stmt)).scalar_one_or_none()
    if not task:
        raise ResourceNotFoundError("Task", task_id)
    await verify_parent_access(session, current_user.id, task.parent_id)
    enforce_record_version(task.updated_at, record_version, conflict_resolution)
    await session.delete(task)
    await session.flush()
    return build_response({"deleted": True, "id": str(task_id)})
