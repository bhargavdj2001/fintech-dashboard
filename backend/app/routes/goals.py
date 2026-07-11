"""
Routes — /goals
"""
import uuid
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_household_id
from app.schemas import GoalContribute, GoalIn, GoalOut, GoalUpdate
from app.services import goal_service

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.get("", response_model=List[GoalOut])
def list_goals(
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return goal_service.get_goals(db, household_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("", response_model=GoalOut, status_code=201)
def create_goal(
    payload: GoalIn,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        return goal_service.create_goal(db, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))


@router.put("/{goal_id}", response_model=GoalOut)
def update_goal(
    goal_id: UUID,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        goal = goal_service.update_goal(db, goal_id, payload, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.delete("/{goal_id}", status_code=204)
def delete_goal(
    goal_id: UUID,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        found = goal_service.delete_goal(db, goal_id, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not found:
        raise HTTPException(status_code=404, detail="Goal not found")


@router.patch("/{goal_id}/contribute", response_model=GoalOut)
def contribute_to_goal(
    goal_id: UUID,
    payload: GoalContribute,
    db: Session = Depends(get_db),
    household_id: uuid.UUID = Depends(get_current_household_id),
):
    try:
        goal = goal_service.contribute_to_goal(db, goal_id, payload.amount, household_id)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.post("/apply-contributions")
def apply_contributions(db: Session = Depends(get_db)):
    """
    Manually trigger the monthly auto-contribute job, so dev/tests don't
    have to wait for the scheduler. The scheduler (see app/main.py) calls
    the same service function automatically once a day.
    """
    try:
        count = goal_service.apply_contributions(db)
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(exc))
    return {"applied": count}
