"""
Investment routes.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import InvestmentOut
from app.services import investment_service

router = APIRouter(prefix="/investments", tags=["Investments"])


@router.get("", response_model=List[InvestmentOut])
def list_investments(db: Session = Depends(get_db)):
    try:
        return investment_service.get_investments(db)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
