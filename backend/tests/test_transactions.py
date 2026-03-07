"""Tests for GET /transactions and GET /transactions/{id}."""


def test_list_transactions_status(client):
    response = client.get("/transactions")
    assert response.status_code == 200


def test_list_transactions_structure(client):
    body = client.get("/transactions").json()
    assert "total" in body
    assert "limit" in body
    assert "offset" in body
    assert "items" in body
    assert isinstance(body["items"], list)
    assert isinstance(body["total"], int)


def test_pagination_limit(client):
    body = client.get("/transactions?limit=2").json()
    assert len(body["items"]) <= 2
    assert body["limit"] == 2


def test_pagination_offset(client):
    all_body = client.get("/transactions?limit=100").json()
    if all_body["total"] < 2:
        return
    page1 = client.get("/transactions?limit=1&offset=0").json()
    page2 = client.get("/transactions?limit=1&offset=1").json()
    assert page1["items"][0]["id"] != page2["items"][0]["id"]


def test_transaction_fields(client):
    body = client.get("/transactions?limit=1").json()
    if not body["items"]:
        return
    txn = body["items"][0]
    required = ["id", "amount", "type", "occurred_at", "currency", "title"]
    for field in required:
        assert field in txn, f"Missing field: {field}"


def test_transaction_amount_is_numeric(client):
    body = client.get("/transactions?limit=50").json()
    for txn in body["items"]:
        assert isinstance(txn["amount"], (int, float)), (
            f"amount for txn {txn['id']} is not numeric"
        )


def test_transaction_type_valid(client):
    valid_types = {"income", "expense", "transfer"}
    body = client.get("/transactions?limit=50").json()
    for txn in body["items"]:
        assert txn["type"] in valid_types, (
            f"Invalid type '{txn['type']}' for txn {txn['id']}"
        )


def test_transaction_occurred_at_iso(client):
    body = client.get("/transactions?limit=5").json()
    for txn in body["items"]:
        oa = txn["occurred_at"]
        assert isinstance(oa, str), f"occurred_at is not a string for {txn['id']}"
        # ISO 8601 — must contain T separator
        assert "T" in oa, f"occurred_at not ISO 8601: {oa}"


def test_get_transaction_by_id(client):
    body = client.get("/transactions?limit=1").json()
    if not body["items"]:
        return
    txn_id = body["items"][0]["id"]
    response = client.get(f"/transactions/{txn_id}")
    assert response.status_code == 200
    detail = response.json()
    assert detail["id"] == txn_id


def test_get_transaction_not_found(client):
    response = client.get("/transactions/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_date_filter(client):
    response = client.get("/transactions?start_date=2026-01-01T00:00:00&end_date=2026-12-31T23:59:59")
    assert response.status_code == 200
    body = response.json()
    assert "items" in body


def test_transaction_splits_structure(client):
    body = client.get("/transactions?limit=10").json()
    for txn in body["items"]:
        assert isinstance(txn["splits"], list)
        for split in txn["splits"]:
            assert "id" in split
            assert "share_amount" in split
            assert "paid_amount" in split
            assert isinstance(split["share_amount"], (int, float))
            assert isinstance(split["paid_amount"], (int, float))
