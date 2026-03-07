"""Tests for GET /reports/period."""


def test_period_report_no_filter(client):
    response = client.get("/reports/period")
    assert response.status_code == 200


def test_period_report_structure(client):
    body = client.get("/reports/period").json()
    required = [
        "total_income", "total_expense", "net_cashflow",
        "transaction_count", "category_summary", "transactions",
    ]
    for field in required:
        assert field in body, f"Missing field: {field}"


def test_period_report_numeric_fields(client):
    body = client.get("/reports/period").json()
    for field in ("total_income", "total_expense", "net_cashflow"):
        assert isinstance(body[field], (int, float)), f"{field} not numeric"


def test_period_report_net_cashflow_consistency(client):
    body = client.get("/reports/period").json()
    expected = round(body["total_income"] - body["total_expense"], 6)
    actual = round(body["net_cashflow"], 6)
    assert abs(expected - actual) < 0.01, (
        f"net_cashflow={actual} != income - expense={expected}"
    )


def test_period_report_count_matches_list(client):
    body = client.get("/reports/period").json()
    assert body["transaction_count"] == len(body["transactions"])


def test_period_report_category_summary_numeric(client):
    body = client.get("/reports/period").json()
    for cat, total in body["category_summary"].items():
        assert isinstance(total, (int, float)), f"category_summary[{cat}] not numeric"


def test_period_report_date_filter(client):
    response = client.get(
        "/reports/period?start_date=2026-01-01T00:00:00&end_date=2026-03-31T23:59:59"
    )
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body["transaction_count"], int)


def test_period_report_transactions_have_required_fields(client):
    body = client.get("/reports/period").json()
    for txn in body["transactions"]:
        assert "id" in txn
        assert "amount" in txn
        assert "type" in txn
        assert "occurred_at" in txn
