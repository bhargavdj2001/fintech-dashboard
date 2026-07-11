"""
Goal service — CRUD operations for savings goals.
"""
import datetime as dt
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models import Goal
from app.schemas import GoalIn, GoalUpdate


def _recompute_status(goal: Goal) -> None:
    if float(goal.current_amount) >= float(goal.target_amount):
        goal.status = "completed"
        return
    if goal.target_date and float(goal.monthly_contribution) > 0:
        remaining = float(goal.target_amount) - float(goal.current_amount)
        months_needed = remaining / float(goal.monthly_contribution)
        months_available = max(
            0,
            (goal.target_date.year - dt.date.today().year) * 12
            + (goal.target_date.month - dt.date.today().month),
        )
        goal.status = "behind" if months_needed > months_available else "on-track"
    else:
        goal.status = "on-track"


def get_goals(db: Session, household_id: UUID) -> list:
    return (
        db.query(Goal)
        .filter(Goal.household_id == household_id)
        .order_by(Goal.created_at.desc())
        .all()
    )


def create_goal(db: Session, payload: GoalIn, household_id: UUID) -> Goal:
    goal = Goal(
        id=uuid4(),
        household_id=household_id,
        name=payload.name,
        category=payload.category,
        target_amount=payload.target_amount,
        current_amount=payload.current_amount,
        monthly_contribution=payload.monthly_contribution,
        target_date=payload.target_date,
        description=payload.description,
    )
    _recompute_status(goal)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def update_goal(db: Session, goal_id: UUID, payload: GoalUpdate, household_id: UUID):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        return None
    if goal.household_id != household_id:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(goal, key, val)
    if "status" not in data:
        _recompute_status(goal)
    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, goal_id: UUID, household_id: UUID) -> bool:
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        return False
    if goal.household_id != household_id:
        return False
    db.delete(goal)
    db.commit()
    return True


def contribute_to_goal(db: Session, goal_id: UUID, amount: float, household_id: UUID):
    goal = db.query(Goal).filter(Goal.id == goal_id).first()
    if not goal:
        return None
    if goal.household_id != household_id:
        return None
    goal.current_amount = float(goal.current_amount) + amount
    _recompute_status(goal)
    db.commit()
    db.refresh(goal)
    return goal


def apply_contributions(db: Session) -> int:
    """
    Once per calendar month, add monthly_contribution to every active goal's
    current_amount. Idempotent via last_contributed_period — running this
    multiple times in the same month is a no-op the second time onward.
    """
    current_period = dt.date.today().strftime("%Y-%m")
    goals = (
        db.query(Goal)
        .filter(
            Goal.monthly_contribution > 0,
            Goal.status != "completed",
        )
        .all()
    )
    applied = 0
    for goal in goals:
        if goal.last_contributed_period == current_period:
            continue
        new_amount = min(float(goal.current_amount) + float(goal.monthly_contribution), float(goal.target_amount))
        goal.current_amount = new_amount
        goal.last_contributed_period = current_period
        _recompute_status(goal)
        applied += 1
    db.commit()
    return applied
