"""Tests for GET /recurring."""


def test_list_recurring_status(client):
    response = client.get("/recurring")
    assert response.status_code == 200


def test_list_recurring_is_list(client):
    assert isinstance(client.get("/recurring").json(), list)


def test_recurring_fields(client):
    body = client.get("/recurring").json()
    if not body:
        return
    rule = body[0]
    assert "id" in rule
    assert "is_active" in rule
    assert isinstance(rule["is_active"], bool)
    if rule["next_run_at"] is not None:
        assert isinstance(rule["next_run_at"], str)
        assert "T" in rule["next_run_at"]
