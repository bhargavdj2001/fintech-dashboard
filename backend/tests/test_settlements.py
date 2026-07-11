"""Tests for /settlements."""


def test_list_settlements_status(client):
    response = client.get("/settlements")
    assert response.status_code == 200


def test_list_settlements_is_list(client):
    assert isinstance(client.get("/settlements").json(), list)


def test_settlement_fields(client):
    body = client.get("/settlements").json()
    if not body:
        return
    s = body[0]
    assert "id" in s
    assert "amount" in s
    assert "from_profile_id" in s
    assert "to_profile_id" in s


def test_create_settlement_validation_bad_amount(client):
    households = client.get("/households").json()
    profiles = client.get("/profiles").json()
    if not households or len(profiles) < 2:
        return
    payload = {
        "household_id": households[0]["id"],
        "from_profile_id": profiles[0]["id"],
        "to_profile_id": profiles[1]["id"],
        "amount": 0,
    }
    response = client.post("/settlements", json=payload)
    assert response.status_code == 422


def test_create_and_delete_settlement_round_trip(client):
    households = client.get("/households").json()
    profiles = client.get("/profiles").json()
    if not households or len(profiles) < 2:
        return
    payload = {
        "household_id": households[0]["id"],
        "from_profile_id": profiles[0]["id"],
        "to_profile_id": profiles[1]["id"],
        "amount": 25.0,
    }
    created = client.post("/settlements", json=payload)
    assert created.status_code == 201
    settlement_id = created.json()["id"]

    listed = client.get("/settlements").json()
    assert any(s["id"] == settlement_id for s in listed)

    deleted = client.delete(f"/settlements/{settlement_id}")
    assert deleted.status_code == 204
