# 🧾 Premium Expense Tracker — Full Stack Application

A production-ready, feature-rich **Expense Tracker** built with Spring Boot, React.js, PostgreSQL, Spring Security, and REST APIs. Designed as a top-tier portfolio project demonstrating modern full-stack development, premium visual styling (dark-mode glassmorphism), and robust engineering practices.

![Tech Stack](https://img.shields.io/badge/Spring_Boot-3.4.1-brightgreen) ![React](https://img.shields.io/badge/React-18.2.0-blue) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue) ![JWT](https://img.shields.io/badge/JWT-Auth-orange) ![Spring Security](https://img.shields.io/badge/Spring_Security-6-red)

---

## ✨ Features

### 🔐 1. JWT Authentication & Spring Security
- **Secure Authentication** — Register, Login, and secure session management.
- **Session Prolongation** — Client-side auto-refresh interval (every 15 minutes) calling `/api/auth/refresh` to transparently renew JWT tokens without user disruption.
- **Spring Security 6** — Modern stateless security filter chain with preflight CORS bypass handling.

### 📈 2. Rich Analytics & Visual Dashboard
- **Cumulative Trajectory Chart** — Interactive area chart showing daily spending progression vs. monthly budget targets.
- **Month-over-Month (MoM) Analytics** — Auto-calculates velocity, burn pacing, and MoM trend vectors.
- **Category Spending breakdown** — Distribution charts rendering clean, HSL-tailored colored badges.

### 💰 3. Budget Control & Warning System
- **Predefined Threshold Alerts** — Alerts when spending approaches 80% or exceeds category/monthly budgets.
- **Visual Budget Trackers** — Modern, color-changing progress bars (Green → Orange → Red) based on actual spending.

### 🔄 4. Self-Healing Recurring Expenses
- **Automated Scheduling** — Set up transactions to repeat Daily, Weekly, Monthly, or Yearly.
- **Self-Healing Catchup Loop** — Database catcher processes missed schedules during server downtime immediately on system startup.

### 🏷️ 5. Premium UX & Inline Category Workflow
- **Inline Category Creator** — Add custom color-coded categories on the fly with a hex color-picker directly inside the expense creation modal.
- **Dark Mode Glassmorphism** — Sleek glass backdrop-filters, subtle gradients, micro-animations, and harmonized typography (Inter/Roboto).

### 📄 6. Clean Binary Document Export
- **PDF Summary Report** — Generate invoice-grade, beautifully aligned PDF reports of all expenses, transaction sums, and category metrics (powered by OpenPDF).
- **CSV Data Export** — Instant, clean spreadsheet downloads.

---

## 🏗️ Architecture

```
expense-tracker/
├── backend/          ← Spring Boot REST API (Port 8081)
└── frontend/         ← React.js SPA (Port 3000)
```

### Backend Design Patterns
`Controller → Service → Repository → PostgreSQL`
- **DTO Pattern** — Strictly isolates entity schemas from incoming HTTP request structures and outgoing JSON payloads.
- **Global Exception Handling** — `@RestControllerAdvice` translates domain-specific exceptions into standardized REST JSON responses.
- **Jakarta Validation** — End-to-end `@Valid` annotations guaranteeing strict bounds, formats, and non-empty requests.

---

## 🔌 API Endpoints

### Authentication & Sessions
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | `/api/auth/register` | ❌ | Register a new user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT details |
| POST | `/api/auth/refresh` | ✅ | Refreshes & prolongs active JWT session |

### Expense & Categories Management
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/expenses` | ✅ | List expenses (supports title/category filters) |
| POST | `/api/expenses` | ✅ | Add a new expense (validates inputs) |
| DELETE | `/api/expenses/{id}` | ✅ | Delete an expense (verifies ownership) |
| GET | `/api/expenses/summary` | ✅ | Fetch high-level statistics and totals |
| GET | `/api/categories` | ✅ | Get user categories |
| POST | `/api/categories` | ✅ | Add custom category (custom color) |
| DELETE | `/api/categories/{id}` | ✅ | Delete category |

### Budgets, Schedules, Insights, & Exports
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | `/api/budgets` | ✅ | Get spending vs budget limits |
| POST | `/api/budgets` | ✅ | Set/update category or monthly budget |
| DELETE | `/api/budgets/{id}` | ✅ | Delete a budget |
| GET | `/api/recurring` | ✅ | List all recurring schedules |
| POST | `/api/recurring` | ✅ | Create new recurring schedule |
| PUT | `/api/recurring/{id}/toggle` | ✅ | Toggle schedule active status |
| DELETE | `/api/recurring/{id}` | ✅ | Delete recurring schedule |
| GET | `/api/expenses/insights` | ✅ | Fetch velocity and spending insights |
| GET | `/api/expenses/export/csv` | ✅ | Export custom CSV spreadsheet |
| GET | `/api/expenses/export/pdf` | ✅ | Stream beautifully rendered PDF report |

---

## 🚀 Setup & Running

### Prerequisites
- **Java 17+** (Developed and validated on JDK 17/23)
- **Node.js 18+** & npm
- **PostgreSQL 14+**

### 1. Database Setup
```sql
-- Open pgAdmin or psql and run:
CREATE DATABASE expensedb;
```

### 2. Backend Setup
```bash
cd backend

# Properties configured in src/main/resources/application.properties:
# spring.datasource.url=jdbc:postgresql://localhost:5432/expensedb
# spring.datasource.username=postgres
# spring.datasource.password=password

# Compile and Run using the Maven Wrapper:
.\mvnw spring-boot:run
```
Backend starts at: **http://localhost:8081**

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
Frontend opens at: **http://localhost:3000**

---

## 🧪 Interactive Validation

### JWT Session Prolongation
Open the browser developer console (F12) while logged in to the dashboard. You will see:
```
Token refreshed successfully
```
every 15 minutes. This runs seamlessly in the background, updating `localStorage` and keeping the user authenticated.

### Smart Insights & Budget Warnings
- Attempt to set an overall monthly budget of **₹10,000** on the Dashboard budget panel.
- Add an expense exceeding the category threshold.
- The **Smart Insights Card** will instantly trigger warnings:
  > ⚠️ WARNING: Groceries has reached 87% of its budget limit!

---

## 🎯 Interview Talking Points

- **"Explain your DB architecture for Recurring Expenses."**
  - Evaluates using custom fields `last_processed_date`, `next_due_date`, and `Frequency` (DAILY, WEEKLY, MONTHLY, YEARLY).
  - Employs a **startup listener** and **scheduled cron catcher** that automatically computes missed occurrences between the last processed date and the current date. It operates in standard Spring Boot `@Transactional` blocks to ensure strict database integrity and prevents duplicate processing.

- **"How does the PDF export work without local file caching?"**
  - Implements Spring `ResponseEntity<byte[]>` streaming.
  - Leverages the `openpdf` library to build page templates in-memory.
  - Maps tabular data, headers, alignment grids, and shapes into an output stream, returning binary buffers with appropriate content headers (`Content-Disposition: attachment; filename=report.pdf`) so browser downloads are processed securely under Bearer token headers.

- **"How did you bypass CORS preflight blocks in Spring Security 6?"**
  - Created a dedicated `CorsConfigurationSource` bean.
  - Allowed custom headers like `Authorization` and methods like `OPTIONS` explicitly, injecting the filters directly into the `securityFilterChain` before authorization gates to prevent 403 Forbidden on preflight pre-checks.

---

## 📁 Project Structure

```
backend/src/main/java/com/expensetracker/
├── config/          SecurityConfig.java (Stateless JWT + CORS)
├── controller/      AuthController, ExpenseController, CategoryController, BudgetController, RecurringExpenseController, ExportController, InsightController
├── dto/             Request/Response DTO models
├── exception/       GlobalExceptionHandler (@RestControllerAdvice maps domain failures to 400/404/500 JSON)
├── model/           JPA Entities (User, Expense, Category, Budget, RecurringExpense)
├── repository/      JPA Interfaces with optimized JPQL queries
├── security/        JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
└── service/         AuthService, ExpenseService, CategoryService, BudgetService, RecurringExpenseService, InsightService, ExportService

frontend/src/
├── components/      Navbar, ExpenseForm (with inline category color-picker), ExpenseList, SummaryCard, CategoryBadge
├── context/         AuthContext (JWT Auto-Refresh loop)
├── pages/           LoginPage, RegisterPage, DashboardPage (Trajectory Area charts, Insights panel, Configurator widgets)
└── services/        api.js (Axios networking layer with automatic Bearer token injection)
```

---

## 👤 Author

Developed by an experienced Full-Stack Engineer with high attention to performance, UI/UX aesthetics, and system reliability.
