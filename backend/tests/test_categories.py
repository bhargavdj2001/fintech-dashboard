"""Tests for GET /categories."""


def test_list_categories_status(client):
    response = client.get("/categories")
    assert response.status_code == 200


def test_list_categories_is_list(client):
    assert isinstance(client.get("/categories").json(), list)


def test_category_fields(client):
    body = client.get("/categories").json()
    if not body:
        return
    cat = body[0]
    assert "id" in cat
    assert "name" in cat
    assert "is_income" in cat
    assert isinstance(cat["is_income"], bool)


def test_filter_income_categories(client):
    response = client.get("/categories?is_income=true")
    assert response.status_code == 200
    body = response.json()
    for cat in body:
        assert cat["is_income"] is True, f"Expected income category, got {cat}"


def test_filter_expense_categories(client):
    body = client.get("/categories?is_income=false").json()
    for cat in body:
        assert cat["is_income"] is False, f"Expected expense category, got {cat}"
