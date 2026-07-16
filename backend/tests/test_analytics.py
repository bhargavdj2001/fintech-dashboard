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
    """
    net_balance = (you_paid - your_share) adjusted by settle-up payments:
    Partner paying you down subtracts, you paying Partner down adds.
    """
    body = client.get("/analytics/splits").json()
    settlements = client.get("/settlements").json()

    settled_to_you = sum(
        s["amount"] for s in settlements
        if s["from_profile"]["name"] == "Partner" and s["to_profile"]["name"] == "Bhargav"
    )
    settled_by_you = sum(
        s["amount"] for s in settlements
        if s["from_profile"]["name"] == "Bhargav" and s["to_profile"]["name"] == "Partner"
    )

    expected_net = round(
        body["you_paid"] - body["your_share"] + settled_by_you - settled_to_you, 6
    )
    actual_net = round(body["net_balance"], 6)
    assert abs(expected_net - actual_net) < 0.01, (
        f"net_balance={actual_net} != expected={expected_net}"
    )


def test_split_shares_nonnegative(client):
    body = client.get("/analytics/splits").json()
    assert body["your_share"] >= 0
    assert body["partner_share"] >= 0
    assert body["you_paid"] >= 0
    assert body["partner_paid"] >= 0
