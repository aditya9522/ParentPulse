# backend/app/api/v1/api.py
from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    families,
    parents,
    caregivers,
    doctors,
    documents,
    medicines,
    appointments,
    measurements,
    timeline,
    maps,
    locations,
    sharing,
    notifications,
    search,
    ai,
    admin,
    tasks,
    expenses,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(families.router)
api_router.include_router(parents.router)
api_router.include_router(caregivers.router)
api_router.include_router(doctors.router)
api_router.include_router(documents.router)
api_router.include_router(medicines.router)
api_router.include_router(appointments.router)
api_router.include_router(measurements.router)
api_router.include_router(timeline.router)
api_router.include_router(maps.router)
api_router.include_router(locations.router)
api_router.include_router(sharing.router)
api_router.include_router(notifications.router)
api_router.include_router(search.router)
api_router.include_router(ai.router)
api_router.include_router(admin.router)
api_router.include_router(tasks.router)
api_router.include_router(expenses.router)
