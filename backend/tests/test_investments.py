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


def test_create_investment_validation_bad_txn_type(client):
    created = client.post("/investments", json={"name": "Test Fund", "instrument": "etf"})
    assert created.status_code == 201
    investment_id = created.json()["id"]

    response = client.post(
        f"/investments/{investment_id}/transactions",
        json={"txn_type": "not-a-real-type", "occurred_at": "2026-01-01T00:00:00Z"},
    )
    assert response.status_code == 422

    client.delete(f"/investments/{investment_id}")


def test_investment_full_crud_round_trip(client):
    created = client.post("/investments", json={"name": "Round Trip Fund", "instrument": "stock"})
    assert created.status_code == 201
    investment_id = created.json()["id"]

    updated = client.put(f"/investments/{investment_id}", json={"name": "Renamed Fund"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Renamed Fund"

    txn_response = client.post(
        f"/investments/{investment_id}/transactions",
        json={"txn_type": "buy", "units": 5, "price_per_unit": 100.0, "occurred_at": "2026-01-01T00:00:00Z"},
    )
    assert txn_response.status_code == 201
    txns = txn_response.json()["investment_transactions"]
    assert len(txns) == 1
    txn_id = txns[0]["id"]

    txn_delete = client.delete(f"/investments/{investment_id}/transactions/{txn_id}")
    assert txn_delete.status_code == 200
    assert txn_delete.json()["investment_transactions"] == []

    deleted = client.delete(f"/investments/{investment_id}")
    assert deleted.status_code == 204

    listed = client.get("/investments").json()
    assert not any(i["id"] == investment_id for i in listed)
