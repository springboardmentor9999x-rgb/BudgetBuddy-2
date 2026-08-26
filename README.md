# BudgetBuddy — Personal Budget Planning and Expense Management System

> **Subtitle**: Your money. Your goals. Your future.

BudgetBuddy is a full-stack personal finance, budget planning, savings goal tracking, and expense management web application. It enables users to track income, manage multiple bank accounts and digital wallets, enforce category spending limits with system alerts, track savings goals with milestone notifications, view interactive analytics with Recharts, and export clean PDF reports via ReportLab.

---

## 🌟 Key Features & Capabilities

### Milestone 1 & Milestone 2 Capabilities
1. **User Authentication & Email Security**:
   - Registration with password strength indicators.
   - OTP email verification workflow.
   - JWT Bearer Authentication protecting frontend views and backend REST APIs.
2. **Multi-Account & Wallet Management**:
   - Manage accounts (Bank Account, Savings Account, Current Account, UPI, Digital Wallet, Cash).
   - Atomic balance updates: Income increases target account balance, expenses deduct from account balance.
3. **Category-Wise Monthly Budgets**:
   - Monthly category limits with utilization progress bars.
   - Overspending detection and status indicators (>80% amber, >100% red).

### Milestone 3 Capabilities
4. **Savings Goals System**:
   - Create, list, update, and delete goals with target amount, current saved amount, target completion date, and goal type (`emergency_fund`, `travel`, `education`, `electronics`, `vehicle`, `other`).
   - Incremental contributions via `PATCH /goals/{id}/contribute`.
   - Milestone notifications automatically emitted at **25%**, **50%**, **75%**, and **100%** completion without duplicate spam.
   - Automatic status transition to `completed` when target is reached.
5. **System Notifications & Overspending Alerts**:
   - Automatic `budget_alert` generation when a category budget is exceeded (enforces single alert per user + category + month).
   - `NotificationBell` UI in top navigation bar with unread count badge and mark-as-read functionality.
   - Endpoint for manual monthly report notification generation (`POST /notifications/generate-monthly-report`).

### Milestone 4 Capabilities
6. **Monthly Analytics Dashboard**:
   - 4 Interactive Recharts Visualizations:
     1. `SpendingPieChart`: Category spending breakdown.
     2. `MonthlyTrendLineChart`: Rolling income vs expenses vs net flow.
     3. `ExpenseHistogram`: Expense amount distribution across ranges (0–500, 500–1000, 1000–2000, 2000–5000, 5000+).
     4. `SavingsDonutChart`: Total saved vs target remaining.
   - Flexible rolling month filter bar ([1 Month] [2 Months] [3 Months] [6 Months] [12 Months]).
7. **ReportLab PDF Financial Reports**:
   - Generate and download monthly PDF reports (`GET /reports/export/pdf?month=M&year=Y`).
   - Includes Executive Summary, Category Expenses, Budget Utilization, Savings Goals, and System Alerts.
   - Works safely with zero/empty data without rendering errors.
8. **Automated Pytest Suite & Database Migrations**:
   - Alembic migration scripts (`alembic/versions/`).
   - Full Pytest test suite covering Auth, Expenses, Budgets, Goals, Milestone Notifications, Budget Alerts, Analytics, PDF Export, and Tenant Ownership Isolation.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS, Axios, React Router v7, Recharts, Lucide Icons
- **Backend**: Python 3.13, FastAPI, SQLAlchemy 2.0 ORM, Pydantic v2, Passlib (bcrypt), PyJWT (python-jose), ReportLab, Alembic
- **Database**: PostgreSQL 18 (`budgetbuddy_db`)
- **Testing**: Pytest, TestClient, SQLite in-memory for testing

---

## 🚀 Environment & Setup Instructions

### 1. Environment Configuration (`backend/.env`)

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/budgetbuddy_db
SECRET_KEY=budgetbuddy_super_secret_jwt_key_2026_finance_prod
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
OTP_EXPIRE_MINUTES=5

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAILS_FROM_EMAIL=noreply.budgetbuddy@gmail.com
EMAILS_FROM_NAME=BudgetBuddy Security
```

### 2. Backend Database Migration & Server Run

```powershell
cd backend
pip install -r requirements.txt
alembic upgrade head
python -m uvicorn app.main:app --port 8000 --reload
```
Swagger API Interactive Documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup & Dev Server Run

```powershell
cd frontend
npm install
npm run dev
```
Web application UI: `http://127.0.0.1:5173/`

---

## 🧪 Automated Testing

Run the full pytest suite:

```powershell
cd backend
python -m pytest -v
```

---

## 📋 API Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/auth/register` | Register new user account |
| **POST** | `/auth/login` | Login & acquire JWT access token |
| **POST** | `/goals` | Create a new savings goal |
| **GET** | `/goals` | List user savings goals (with month, year, status, goal_type filters) |
| **GET** | `/goals/{id}` | Get single goal by ID (ownership checked) |
| **PUT** | `/goals/{id}` | Update goal details (ownership checked) |
| **DELETE** | `/goals/{id}` | Delete goal by ID (ownership checked) |
| **PATCH** | `/goals/{id}/contribute` | Increment saved amount & check milestone notifications |
| **GET** | `/notifications` | List user notifications sorted by newest first |
| **PATCH** | `/notifications/{id}/read` | Mark notification as read |
| **POST** | `/notifications/generate-monthly-report` | Generate monthly report summary alert |
| **GET** | `/analytics/spending-by-category` | Category expense data for Pie Chart |
| **GET** | `/analytics/monthly-trend` | Income vs expense trend data for Line Chart |
| **GET** | `/analytics/savings-progress` | Goals progress data for Donut Chart |
| **GET** | `/analytics/expense-distribution` | Expense range distribution for Histogram |
| **GET** | `/analytics/summary` | Aggregate financial KPIs and budget usage |
| **GET** | `/reports/monthly` | Get structured JSON report data for target month/year |
| **GET** | `/reports/export/pdf` | Export PDF document stream via ReportLab |
