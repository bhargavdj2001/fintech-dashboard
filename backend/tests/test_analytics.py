"""Tests for GET /analytics/splits."""


def test_split_summary_status(client):
    response = client.get("/analytics/splits")
    assert response.status_code == 200


def test_split_summary_fields(client):
    body = client.get("/analytics/splits").json()
    required = ["your_share", "partner_share", "you_paid", "partner_paid", "net_balance"]
    for field in required:
        assert field in body, f"Missing field: {field}"


def test_split_summary_numeric(client):
    body = client.get("/analytics/splits").json()
    for field, value in body.items():
        assert isinstance(value, (int, float)), (
            f"Field '{field}' is not numeric: {value!r}"
        )


def test_split_summary_net_balance_consistency(client):
    body = client.get("/analytics/splits").json()
    expected_net = round(body["you_paid"] - body["your_share"], 6)
    actual_net = round(body["net_balance"], 6)
    assert abs(expected_net - actual_net) < 0.01, (
        f"net_balance={actual_net} != you_paid - your_share={expected_net}"
    )


def test_split_shares_nonnegative(client):
    body = client.get("/analytics/splits").json()
    assert body["your_share"] >= 0
    assert body["partner_share"] >= 0
    assert body["you_paid"] >= 0
    assert body["partner_paid"] >= 0
