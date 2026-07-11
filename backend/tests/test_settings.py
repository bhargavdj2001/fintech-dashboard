"""Tests for /settings."""


def test_get_settings_status(client):
    response = client.get("/settings")
    assert response.status_code == 200


def test_get_settings_fields(client):
    body = client.get("/settings").json()
    assert "default_currency" in body
    assert "theme" in body
    assert "notifications" in body
    assert isinstance(body["notifications"], dict)


def test_get_settings_is_idempotent(client):
    """Repeated GETs should return the same settings row (get-or-create, not create-every-time)."""
    first = client.get("/settings").json()
    second = client.get("/settings").json()
    assert first["id"] == second["id"]


def test_update_settings_round_trip(client):
    original = client.get("/settings").json()
    updated = client.put("/settings", json={"theme": "light"})
    assert updated.status_code == 200
    assert updated.json()["theme"] == "light"

    # restore original theme so other test runs aren't affected
    client.put("/settings", json={"theme": original["theme"]})
