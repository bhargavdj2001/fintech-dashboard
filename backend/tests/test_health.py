"""Tests for the health-check root endpoint."""


def test_root_health(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "service" in body
    assert "version" in body
