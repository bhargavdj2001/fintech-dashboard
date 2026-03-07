# FinancialOS Backend

FastAPI backend for the FinancialOS personal finance dashboard.
Connects to an existing Supabase PostgreSQL database — no migrations required.

---

## 1. Install dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

---

## 2. Create the .env file

```bash
cp .env.example .env
```

Edit `.env` and set your Supabase connection string:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres
```

---

## 3. Run the backend server

```bash
uvicorn app.main:app --reload
```

The server starts at **http://localhost:8000**

Swagger UI is available at **http://localhost:8000/docs**

---

## 4. API Reference

### Health check

```
GET /
```

### Transactions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/transactions` | Paginated transaction list |
| GET | `/transactions/{id}` | Single transaction with splits |
| POST | `/transactions` | Create a new transaction |

**Query parameters for GET /transactions:**

| Param | Type | Description |
|-------|------|-------------|
| `start_date` | ISO datetime | Filter from date |
| `end_date` | ISO datetime | Filter to date |
| `account_id` | UUID | Filter by account |
| `category_id` | UUID | Filter by category |
| `limit` | int (default 50) | Page size |
| `offset` | int (default 0) | Page offset |

**POST /transactions body example:**

```json
{
  "title": "Grocery run",
  "amount": 127.45,
  "type": "expense",
  "account_id": "uuid-here",
  "category_id": "uuid-here",
  "occurred_at": "2024-03-05T18:00:00Z",
  "splits": [
    { "profile_id": "uuid-here", "share_amount": 63.73, "paid_amount": 127.45 },
    { "profile_id": "uuid-here", "share_amount": 63.72, "paid_amount": 0 }
  ]
}
```

### Analytics

```
GET /analytics/splits
```

Returns split-expense ownership summary:

```json
{
  "your_share": 500.00,
  "partner_share": 500.00,
  "you_paid": 750.00,
  "partner_paid": 250.00,
  "net_balance": 250.00
}
```

### Reports

```
GET /reports/period?start_date=2024-03-01T00:00:00Z&end_date=2024-03-31T23:59:59Z
```

Returns:

```json
{
  "total_income": 5200.00,
  "total_expense": 2340.50,
  "net_cashflow": 2859.50,
  "transaction_count": 14,
  "category_summary": {
    "Food & Dining": 450.00,
    "Transport": 120.00
  },
  "transactions": [...]
}
```

### Accounts

```
GET /accounts
GET /accounts?active_only=false
```

### Categories

```
GET /categories
GET /categories?type=expense
```
