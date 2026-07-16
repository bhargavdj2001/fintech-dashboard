"""Tests for GET /accounts."""


def test_list_accounts_status(client):
    response = client.get("/accounts")
    assert response.status_code == 200


def test_list_accounts_is_list(client):
    response = client.get("/accounts")
    body = response.json()
    assert isinstance(body, list)


def test_account_fields(client):
    body = client.get("/accounts").json()
    if not body:
        return  # no data seeded — skip field check
    account = body[0]
    assert "id" in account
    assert "name" in account
    assert "type" in account
    assert "currency" in account
    assert "opening_balance" in account
    assert "current_balance" in account
    assert isinstance(account["current_balance"], (int, float))


def test_account_balance_is_numeric(client):
    body = client.get("/accounts").json()
    for account in body:
        assert isinstance(account["current_balance"], (int, float)), (
            f"current_balance for account {account['id']} is not numeric"
        )


def test_account_id_is_string(client):
    body = client.get("/accounts").json()
    for account in body:
        assert isinstance(account["id"], str), (
            f"id for account {account['name']} is not a string"
        )


def test_create_account_validation_bad_type(client):
    households = client.get("/households").json()
    payload = {
        "household_id": households[0]["id"],
        "name": "Test Account",
        "type": "not-a-real-type",
    }
    response = client.post("/accounts", json=payload)
    assert response.status_code == 422


def test_create_and_delete_account_round_trip(client):
    households = client.get("/households").json()
    payload = {
        "household_id": households[0]["id"],
        "name": "Round Trip Test Account",
        "type": "cash",
        "opening_balance": 42.0,
    }
    created = client.post("/accounts", json=payload)
    assert created.status_code == 201
    account_id = created.json()["id"]

    listed = client.get("/accounts").json()
    assert any(a["id"] == account_id for a in listed)

    deleted = client.delete(f"/accounts/{account_id}")
    assert deleted.status_code == 204

    listed_after = client.get("/accounts").json()
    assert not any(a["id"] == account_id for a in listed_after)


def test_delete_account_with_transactions_returns_409(client):
    accounts = client.get("/accounts").json()
    for account in accounts:
        txns = client.get("/transactions", params={"account_id": account["id"], "limit": 1}).json()
        if txns["total"] > 0:
            response = client.delete(f"/accounts/{account['id']}")
            assert response.status_code == 409
            return
