"""Tests for GET /budgets and POST /budgets."""


def test_list_budgets_status(client):
    response = client.get("/budgets")
    assert response.status_code == 200


def test_list_budgets_is_list(client):
    assert isinstance(client.get("/budgets").json(), list)


def test_budget_fields(client):
    body = client.get("/budgets").json()
    if not body:
        return
    b = body[0]
    assert "id" in b
    assert "name" in b
    assert "amount" in b
    assert "period_type" in b
    assert isinstance(b["amount"], (int, float))
    assert b["period_type"] in ("monthly", "yearly")


def test_create_budget_validation_bad_type(client):
    """period_type must be monthly|yearly — reject invalid values."""
    payload = {
        "household_id": "a1f20322-bfc4-44e4-ba53-06598948849c",
        "name": "Test Budget",
        "amount": 1000.0,
        "period_type": "quarterly",  # invalid
    }
    response = client.post("/budgets", json=payload)
    assert response.status_code == 422


def test_create_budget_validation_bad_amount(client):
    """amount must be > 0."""
    payload = {
        "household_id": "a1f20322-bfc4-44e4-ba53-06598948849c",
        "name": "Zero Budget",
        "amount": 0.0,
        "period_type": "monthly",
    }
    response = client.post("/budgets", json=payload)
    assert response.status_code == 422
