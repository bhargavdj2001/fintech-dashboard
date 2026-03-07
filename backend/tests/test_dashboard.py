"""Tests for GET /dashboard/summary."""


def test_dashboard_summary_status(client):
    response = client.get("/dashboard/summary")
    assert response.status_code == 200


def test_dashboard_summary_fields(client):
    body = client.get("/dashboard/summary").json()
    required = [
        "total_balance", "monthly_income", "monthly_expense",
        "net_cashflow", "recent_transactions", "category_breakdown",
    ]
    for field in required:
        assert field in body, f"Missing field: {field}"


def test_dashboard_summary_numeric_fields(client):
    body = client.get("/dashboard/summary").json()
    for field in ("total_balance", "monthly_income", "monthly_expense", "net_cashflow"):
        assert isinstance(body[field], (int, float)), f"{field} not numeric"


def test_dashboard_net_cashflow_consistency(client):
    body = client.get("/dashboard/summary").json()
    expected = round(body["monthly_income"] - body["monthly_expense"], 6)
    actual = round(body["net_cashflow"], 6)
    assert abs(expected - actual) < 0.01, (
        f"net_cashflow={actual} != income - expense={expected}"
    )


def test_dashboard_recent_transactions_list(client):
    body = client.get("/dashboard/summary").json()
    assert isinstance(body["recent_transactions"], list)
    assert len(body["recent_transactions"]) <= 5


def test_dashboard_recent_transactions_fields(client):
    body = client.get("/dashboard/summary").json()
    for txn in body["recent_transactions"]:
        assert "id" in txn
        assert "amount" in txn
        assert "type" in txn
        assert isinstance(txn["amount"], (int, float))


def test_dashboard_category_breakdown_dict(client):
    body = client.get("/dashboard/summary").json()
    cb = body["category_breakdown"]
    assert isinstance(cb, dict)
    for cat, value in cb.items():
        assert isinstance(cat, str)
        assert isinstance(value, (int, float))


def test_dashboard_total_balance_nonnegative_or_debt(client):
    body = client.get("/dashboard/summary").json()
    # Just verify it's a real number (can be negative if in debt)
    assert isinstance(body["total_balance"], (int, float))
