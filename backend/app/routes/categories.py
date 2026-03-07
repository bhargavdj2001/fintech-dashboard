"""
Routes — /categories
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models import Category
from app.schemas import CategoryOut

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=List[CategoryOut])
def list_categories(
    is_income: Optional[bool] = Query(
        None,
        description="true → income categories only, false → expense categories only",
    ),
    db: Session = Depends(get_db),
):
    """
    Return all categories.
    Filter with ?is_income=true for income categories or ?is_income=false for expense categories.
    """
    try:
        q = db.query(Category)
        if is_income is not None:
            q = q.filter(Category.is_income == is_income)
        return q.order_by(Category.name).all()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
