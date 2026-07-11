"""
Category service — CRUD operations for transaction/budget categories.
"""
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models import Budget, Category, Transaction
from app.schemas import CategoryIn, CategoryUpdate


class CategoryInUseError(Exception):
    """Raised when a category can't be deleted because it's referenced elsewhere."""


def get_categories(
    db: Session, household_id: UUID, is_income: Optional[bool] = None
) -> list:
    q = db.query(Category).filter(
        or_(Category.household_id == household_id, Category.household_id.is_(None))
    )
    if is_income is not None:
        q = q.filter(Category.is_income == is_income)
    return q.order_by(Category.name).all()


def create_category(db: Session, payload: CategoryIn, household_id: UUID) -> Category:
    category = Category(
        id=uuid4(),
        household_id=household_id,
        name=payload.name,
        parent_id=payload.parent_id,
        is_income=payload.is_income,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(
    db: Session, category_id: UUID, payload: CategoryUpdate, household_id: UUID
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return None
    if category.household_id != household_id:
        return None
    data = payload.model_dump(exclude_none=True)
    for key, val in data.items():
        setattr(category, key, val)
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: UUID, household_id: UUID) -> bool:
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        return False
    if category.household_id != household_id:
        return False
    if db.query(Transaction).filter(Transaction.category_id == category_id).first():
        raise CategoryInUseError("Category has transactions and cannot be deleted")
    if db.query(Budget).filter(Budget.category_id == category_id).first():
        raise CategoryInUseError("Category has budgets and cannot be deleted")
    if db.query(Category).filter(Category.parent_id == category_id).first():
        raise CategoryInUseError("Category has subcategories and cannot be deleted")
    db.delete(category)
    db.commit()
    return True
