"""Tests for /goals."""


def test_list_goals_status(client):
    response = client.get("/goals")
    assert response.status_code == 200


def test_list_goals_is_list(client):
    assert isinstance(client.get("/goals").json(), list)


def test_goal_fields(client):
    body = client.get("/goals").json()
    if not body:
        return
    g = body[0]
    assert "id" in g
    assert "name" in g
    assert "target_amount" in g
    assert "current_amount" in g
    assert "status" in g
    assert g["status"] in ("on-track", "behind", "completed")


def test_create_goal_validation_bad_target_amount(client):
    households = client.get("/households").json()
    payload = {
        "household_id": households[0]["id"],
        "name": "Zero Goal",
        "target_amount": 0,
    }
    response = client.post("/goals", json=payload)
    assert response.status_code == 422


def test_goal_full_crud_round_trip(client):
    households = client.get("/households").json()
    payload = {
        "household_id": households[0]["id"],
        "name": "Round Trip Goal",
        "target_amount": 1000.0,
        "monthly_contribution": 100.0,
    }
    created = client.post("/goals", json=payload)
    assert created.status_code == 201
    goal_id = created.json()["id"]
    assert created.json()["status"] == "on-track"

    updated = client.put(f"/goals/{goal_id}", json={"name": "Renamed Goal"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Renamed Goal"

    contributed = client.patch(f"/goals/{goal_id}/contribute", json={"amount": 1000.0})
    assert contributed.status_code == 200
    assert contributed.json()["status"] == "completed"

    deleted = client.delete(f"/goals/{goal_id}")
    assert deleted.status_code == 204

    listed = client.get("/goals").json()
    assert not any(g["id"] == goal_id for g in listed)
