"""Tests for GET /investments."""


def test_list_investments_status(client):
    response = client.get("/investments")
    assert response.status_code == 200


def test_list_investments_is_list(client):
    assert isinstance(client.get("/investments").json(), list)


def test_investment_fields(client):
    body = client.get("/investments").json()
    if not body:
        return
    inv = body[0]
    assert "id" in inv
    assert "name" in inv
    assert "investment_transactions" in inv
    assert isinstance(inv["investment_transactions"], list)


def test_investment_transaction_fields(client):
    body = client.get("/investments").json()
    for inv in body:
        for it in inv["investment_transactions"]:
            assert "id" in it
            assert "txn_type" in it
            assert "occurred_at" in it
            if it["units"] is not None:
                assert isinstance(it["units"], (int, float))
            if it["price_per_unit"] is not None:
                assert isinstance(it["price_per_unit"], (int, float))
