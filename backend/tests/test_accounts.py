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
    assert "balance" in account
    assert isinstance(account["balance"], (int, float))


def test_account_balance_is_numeric(client):
    body = client.get("/accounts").json()
    for account in body:
        assert isinstance(account["balance"], (int, float)), (
            f"balance for account {account['id']} is not numeric"
        )


def test_account_id_is_string(client):
    body = client.get("/accounts").json()
    for account in body:
        assert isinstance(account["id"], str), (
            f"id for account {account['name']} is not a string"
        )
