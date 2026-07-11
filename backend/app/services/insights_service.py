"""
Rule-based insights — deterministic observations computed from real data.
No LLM call; an insight is only emitted if the underlying condition is real.
"""
import calendar
import datetime as dt
from typing import Optional
from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import Category, Goal, RecurringRule, Transaction
from app.services import budget_service


def _month_bounds(year: int, month: int) -> tuple[dt.datetime, dt.datetime]:
    start = dt.datetime(year, month, 1, tzinfo=dt.timezone.utc)
    last_day = calendar.monthrange(year, month)[1]
    end = dt.datetime(year, month, last_day, 23, 59, 59, tzinfo=dt.timezone.utc)
    return start, end


def _prev_month(year: int, month: int) -> tuple[int, int]:
    return (year - 1, 12) if month == 1 else (year, month - 1)


def _check_budget_overspend(db: Session, household_id: UUID) -> list:
    insights = []
    budgets = budget_service.get_budgets(db, household_id)
    for budget in budgets:
        if not budget.category_id:
            continue
        spent = budget.spent
        amount = budget.effective_amount  # base amount + any rolled-over surplus
        if spent > amount and amount > 0:
            overage = spent - amount
            pct = (overage / amount) * 100
            insights.append({
                "id": f"budget-overspend-{budget.id}",
                "type": "alert",
                "priority": "high",
                "title": f"{budget.category.name if budget.category else budget.name} Budget Alert",
                "description": (
                    f"You've exceeded your {budget.category.name if budget.category else budget.name} "
                    f"budget by {overage:.2f} ({pct:.0f}% over) this period."
                ),
                "action": "Review Budget",
                "action_href": "/budgets",
            })
    return insights


def _category_totals(db: Session, start: dt.datetime, end: dt.datetime, household_id: UUID) -> dict:
    results = (
        db.query(Transaction.category_id, func.sum(Transaction.amount))
        .filter(
            Transaction.household_id == household_id,
            Transaction.type == "expense",
            Transaction.occurred_at >= start,
            Transaction.occurred_at <= end,
        )
        .group_by(Transaction.category_id)
        .all()
    )
    return {cat_id: float(total) for cat_id, total in results if cat_id}


def _check_category_trends(db: Session, household_id: UUID) -> list:
    insights = []
    now = dt.date.today()
    cur_start, cur_end = _month_bounds(now.year, now.month)
    prev_year, prev_month = _prev_month(now.year, now.month)
    prev_start, prev_end = _month_bounds(prev_year, prev_month)

    current = _category_totals(db, cur_start, cur_end, household_id)
    previous = _category_totals(db, prev_start, prev_end, household_id)
    if not previous:
        return insights

    categories = {c.id: c for c in db.query(Category).filter(Category.id.in_(list(current) + list(previous))).all()}

    for cat_id, prev_amount in previous.items():
        if prev_amount <= 0:
            continue
        cur_amount = current.get(cat_id, 0.0)
        change_pct = ((cur_amount - prev_amount) / prev_amount) * 100
        if abs(change_pct) < 20:
            continue
        name = categories[cat_id].name if cat_id in categories else "A category"
        if change_pct > 0:
            insights.append({
                "id": f"trend-up-{cat_id}",
                "type": "anomaly",
                "priority": "medium",
                "title": f"{name} Spending Up",
                "description": (
                    f"{name} spending is {change_pct:.0f}% higher than last month "
                    f"({cur_amount:.2f} vs {prev_amount:.2f})."
                ),
                "action": "Review Transactions",
                "action_href": "/transactions",
            })
        else:
            insights.append({
                "id": f"trend-down-{cat_id}",
                "type": "positive",
                "priority": "low",
                "title": f"{name} Spending Down",
                "description": (
                    f"{name} spending is {abs(change_pct):.0f}% lower than last month "
                    f"({cur_amount:.2f} vs {prev_amount:.2f})."
                ),
                "action": "View Transactions",
                "action_href": "/transactions",
            })
    return insights


def _check_savings_rate(db: Session, household_id: UUID) -> Optional[dict]:
    now = dt.date.today()
    cur_start, cur_end = _month_bounds(now.year, now.month)
    prev_year, prev_month = _prev_month(now.year, now.month)
    prev_start, prev_end = _month_bounds(prev_year, prev_month)

    def income_expense(start, end):
        row = (
            db.query(
                func.coalesce(func.sum(Transaction.amount).filter(Transaction.type == "income"), 0),
                func.coalesce(func.sum(Transaction.amount).filter(Transaction.type == "expense"), 0),
            )
            .filter(
                Transaction.household_id == household_id,
                Transaction.occurred_at >= start,
                Transaction.occurred_at <= end,
            )
            .one()
        )
        return float(row[0]), float(row[1])

    cur_income, cur_expense = income_expense(cur_start, cur_end)
    prev_income, prev_expense = income_expense(prev_start, prev_end)
    if cur_income <= 0 or prev_income <= 0:
        return None

    cur_rate = (cur_income - cur_expense) / cur_income * 100
    prev_rate = (prev_income - prev_expense) / prev_income * 100
    diff = cur_rate - prev_rate
    if abs(diff) < 1:
        return None

    if diff > 0:
        return {
            "id": "savings-rate-up",
            "type": "positive",
            "priority": "medium",
            "title": "Savings Rate Improved",
            "description": f"Your savings rate improved from {prev_rate:.0f}% to {cur_rate:.0f}% this month.",
            "action": "View Reports",
            "action_href": "/reports",
        }
    return {
        "id": "savings-rate-down",
        "type": "alert",
        "priority": "medium",
        "title": "Savings Rate Dropped",
        "description": f"Your savings rate dropped from {prev_rate:.0f}% to {cur_rate:.0f}% this month.",
        "action": "View Reports",
        "action_href": "/reports",
    }


def _check_goals(db: Session, household_id: UUID) -> list:
    goals = db.query(Goal).filter(Goal.household_id == household_id).all()
    if not goals:
        return []
    behind = [g for g in goals if g.status == "behind"]
    if behind:
        return [
            {
                "id": f"goal-behind-{g.id}",
                "type": "goal",
                "priority": "medium",
                "title": f"{g.name} Is Behind",
                "description": (
                    f"{g.name} is behind schedule — you've saved {float(g.current_amount):.2f} "
                    f"of {float(g.target_amount):.2f}."
                ),
                "action": "View Goal",
                "action_href": "/goals",
            }
            for g in behind
        ]
    return [{
        "id": "goals-on-track",
        "type": "positive",
        "priority": "low",
        "title": "Goals On Track",
        "description": f"All {len(goals)} of your savings goals are on track or completed.",
        "action": "View Goals",
        "action_href": "/goals",
    }]


def _check_recurring_cost(db: Session, household_id: UUID) -> Optional[dict]:
    rules = db.query(RecurringRule).filter(
        RecurringRule.household_id == household_id,
        RecurringRule.is_active.is_(True),
    ).all()
    expense_rules = [r for r in rules if (r.template_txn or {}).get("type", "expense") == "expense"]
    if not expense_rules:
        return None
    total = sum(float((r.template_txn or {}).get("amount", 0)) for r in expense_rules)
    if total <= 0:
        return None
    return {
        "id": "recurring-cost",
        "type": "opportunity",
        "priority": "low",
        "title": "Active Recurring Payments",
        "description": (
            f"You have {len(expense_rules)} active recurring payment(s) totaling "
            f"{total:.2f} per period — review if all are still needed."
        ),
        "action": "Review Recurring",
        "action_href": "/recurring",
    }


_PRIORITY_ORDER = {"high": 0, "medium": 1, "low": 2}


def get_alerts(db: Session, household_id: UUID) -> list:
    """Lightweight alert objects shown in the notification bell.

    Two classes:
    - budget_overrun: spent > effective_amount
    - goal_milestone: goal just crossed 50% / 75% / 90% / 100%
    """
    alerts = []

    # Budget overruns
    for budget in budget_service.get_budgets(db, household_id):
        if not budget.category_id:
            continue
        amount = budget.effective_amount
        if amount <= 0:
            continue
        pct = (budget.spent / amount) * 100
        name = budget.category.name if budget.category else budget.name
        if pct >= 100:
            alerts.append({
                "id": f"budget-overrun-{budget.id}",
                "severity": "error",
                "title": f"{name} budget exceeded",
                "body": f"You're {pct - 100:.0f}% over your {name} budget this period.",
                "href": "/budgets",
            })
        elif pct >= 80:
            alerts.append({
                "id": f"budget-warn-{budget.id}",
                "severity": "warning",
                "title": f"{name} budget at {pct:.0f}%",
                "body": f"You've used {pct:.0f}% of your {name} budget this period.",
                "href": "/budgets",
            })

    # Goal milestones
    for goal in db.query(Goal).filter(Goal.household_id == household_id, Goal.status != "completed").all():
        target = float(goal.target_amount)
        if target <= 0:
            continue
        pct = float(goal.current_amount) / target * 100
        for milestone in (100, 90, 75, 50):
            if pct >= milestone:
                alerts.append({
                    "id": f"goal-milestone-{goal.id}-{milestone}",
                    "severity": "success" if milestone == 100 else "info",
                    "title": f"Goal milestone: {goal.name}",
                    "body": f"You've reached {pct:.0f}% of your {goal.name} goal!",
                    "href": "/goals",
                })
                break  # only the highest milestone per goal

    return alerts


def get_insights(db: Session, household_id: UUID) -> list:
    insights = []
    insights.extend(_check_budget_overspend(db, household_id))
    insights.extend(_check_category_trends(db, household_id))
    savings = _check_savings_rate(db, household_id)
    if savings:
        insights.append(savings)
    insights.extend(_check_goals(db, household_id))
    recurring = _check_recurring_cost(db, household_id)
    if recurring:
        insights.append(recurring)
    insights.sort(key=lambda i: _PRIORITY_ORDER.get(i["priority"], 3))
    return insights
