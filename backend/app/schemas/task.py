# backend/app/schemas/task.py
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.core.constants import TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    id: uuid.UUID | None = None
    parent_id: uuid.UUID
    family_id: uuid.UUID
    title: str
    description: str | None = None
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: datetime | None = None
    assigned_to_user_id: uuid.UUID | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    priority: TaskPriority | None = None
    status: TaskStatus | None = None
    due_date: datetime | None = None
    assigned_to_user_id: uuid.UUID | None = None


class TaskResponse(BaseModel):
    id: uuid.UUID
    parent_id: uuid.UUID
    family_id: uuid.UUID
    title: str
    description: str | None = None
    priority: str
    status: str
    due_date: datetime | None = None
    assigned_to_user_id: uuid.UUID | None = None
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
