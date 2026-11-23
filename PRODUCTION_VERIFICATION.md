# Production Verification Report — Expense Tracker

**Deployment Date**: November 23, 2026  
**Status**: 🟢 **VERIFIED LIVE IN PRODUCTION**  
**Live URL**: [https://expense-tracker-app-xxjb.onrender.com](https://expense-tracker-app-xxjb.onrender.com)  
**Login Page**: [https://expense-tracker-app-xxjb.onrender.com/login](https://expense-tracker-app-xxjb.onrender.com/login)  
**Repository**: [https://github.com/saipranav22-commits/expense-tracker](https://github.com/saipranav22-commits/expense-tracker)  
**Hosting Provider**: Render (Free Web Service — Unified Multi-Stage Docker)  
**Database**: Neon Serverless PostgreSQL (Free Tier)  
**Last Verified Deployment Commit**: `1350aa8`

---

## 1. Executive Summary
The Expense Tracker application is deployed as a unified single-container runtime (React 18 SPA + Spring Boot 3.4.1 monolithic web service) on Render's Free tier, backed by Neon's serverless PostgreSQL.

All production API flows—including user registration, JWT login, expense CRUD, category creation, budget setup, recurring expense scheduling, rule-based insight generation, and binary document downloads (CSV and OpenPDF)—were directly validated against the live HTTPS production endpoint (`https://expense-tracker-app-xxjb.onrender.com`).

---

## 2. Verified Test Matrix & Evidence

| # | Test Scenario | Verified Endpoint / Method | Production Evidence | Result |
|---|---|---|---|---|
| **1** | **Root SPA Delivery** | `GET /` | Returns `HTTP 200 OK`, `index.html` referencing `/static/js/main.e78273b2.js` and `/static/css/main.a676b597.css`. | ✅ **PASS** |
| **2** | **Deep SPA Routing** | `GET /login` | Spring Boot `SpaWebConfig` forwards non-API paths to `index.html`; returns `HTTP 200 OK` without 404 error. | ✅ **PASS** |
| **3** | **User Registration** | `POST /api/auth/register` | Request: `{"name":"Production Tester","email":"prodtest_001@example.com","password":"..."}`<br>Response: HTTP 200, JWT token returned (`eyJhbGci...`). | ✅ **PASS** |
| **4** | **JWT Authentication** | `POST /api/auth/login` | Verified authentication with valid credentials; issued 24-hour signed JWT token used for subsequent Bearer requests. | ✅ **PASS** |
| **5** | **Category Creation** | `POST /api/categories`<br>`GET /api/categories` | Created Category ID 1 (`Utilities`), ID 2 (`Groceries`), ID 3 (`Cloud & SaaS`). Fetched and verified in user category list. | ✅ **PASS** |
| **6** | **Expense Creation** | `POST /api/expenses` | Created expenses with amounts ($84.50, $14.99, $5.49) mapped to Category IDs. Verified persistence in Neon DB. | ✅ **PASS** |
| **7** | **Expense Retrieval** | `GET /api/expenses` | Returns user transactions sorted by date descending. Verified correct JSON payload structure. | ✅ **PASS** |
| **8** | **Expense Deletion** | `DELETE /api/expenses/{id}` | Deleted created expense ID 6. Verified deletion by querying `/api/expenses` and observing count decrease. | ✅ **PASS** |
| **9** | **Budget Management** | `POST /api/budgets`<br>`GET /api/budgets` | Created Budget ID 1 ($500.00) assigned to Category ID 1 (`Utilities`). Verified retrieval via `/api/budgets`. | ✅ **PASS** |
| **10** | **Recurring Expenses** | `POST /api/recurring`<br>`PUT /api/recurring/{id}/toggle` | Created recurring expense ID 1 ($12.00, `MONTHLY`). Executed toggle endpoint; verified `active` flag changed from `true` to `false`. | ✅ **PASS** |
| **11** | **Spending Insights** | `GET /api/expenses/insights` | Evaluated budget thresholds; returned rule-based insight objects (`[INFO] ...`) based on current user expense data. | ✅ **PASS** |
| **12** | **CSV Data Export** | `GET /api/expenses/export/csv` | Downloaded 602-character CSV formatted with headers (`ID,Title,Amount (INR),Date,Category,Description,Created At`). | ✅ **PASS** |
| **13** | **PDF Report Export** | `GET /api/expenses/export/pdf` | Generated and downloaded 2,115-byte binary document with valid `%PDF-1.5` magic header using OpenPDF (`com.github.librepdf:openpdf:1.3.30`). | ✅ **PASS** |
| **14** | **CORS Origin Rejection** | `OPTIONS /api/expenses`<br>`Origin: https://malicious-site.example.com` | Blocked unauthorized cross-origin request with `HTTP 403 Forbidden` (`Invalid CORS request`). | ✅ **PASS** |
| **15** | **CORS Origin Acceptance** | `OPTIONS /api/expenses`<br>`Origin: https://expense-tracker-app-xxjb.onrender.com` | Allowed production origin with `HTTP 200 OK` and proper preflight headers. | ✅ **PASS** |

---

## 3. Browser Testing Status

- **Automated Browser Subagent**: Attempted execution via Chrome DevTools protocol (`chrome_devtools`), but the connection timed out waiting for the local interactive Chrome remote debugging confirmation prompt (`context deadline exceeded`).
- **Direct HTTP & SPA Verification**:
  - The bundled React production JavaScript bundle (`/static/js/main.e78273b2.js`) and CSS bundle (`/static/css/main.a676b597.css`) are served with `HTTP 200 OK` and correct MIME types.
  - Client-side routing resolves without server errors or asset 404s.
  - Manual browser verification can be executed at [https://expense-tracker-app-xxjb.onrender.com/login](https://expense-tracker-app-xxjb.onrender.com/login) in any desktop or mobile browser.

---

## 4. Architecture & Security Review

- **Zero Hardcoded Secrets**: All production database credentials (`SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`) and JWT signing keys (`JWT_SECRET`) are injected exclusively via Render environment variables.
- **Container Hardening**: The multi-stage Docker container runs under an unprivileged user (`appuser:appgroup`), mitigating container escape risks.
- **HikariCP Pool Configuration**: Parameterized with `maximum-pool-size=5`, `max-lifetime=60000ms`, and `idle-timeout=30000ms` to cleanly tolerate Neon serverless compute sleep cycles without connection leaks.
- **Isolated User Data**: All JPA repository queries enforce isolation by authenticated `userId`, preventing cross-account data leakage.

---

## 5. Free-Tier Operational Characteristics & Limitations

1. **Render Free Tier Spin-Down**:
   - The web service instance spins down after 15 minutes of inactivity.
   - The first request after idling triggers a cold start (~50 seconds) while the JVM initializes.
2. **Neon Serverless Database Suspension**:
   - Neon serverless compute suspends after 5 minutes of idle queries. Hikari pool handles reconnects automatically on incoming requests.
3. **Monthly Bandwidth & Usage**:
   - 750 free instance hours per month on Render, suitable for portfolio demonstrations.

---

## 6. ATS-Friendly Resume Bullet Points

- **Full-Stack Application Deployment & Containerization**: Architected and deployed an end-to-end Expense Tracker application combining a React 18 SPA and Spring Boot 3 REST API into a unified multi-stage Docker container on Render Free Tier backed by Neon Serverless PostgreSQL with zero hosting costs.
- **Resilient Cloud & Database Integration**: Implemented a 12-factor production pipeline with Java 21, stateless JWT authentication via Spring Security, strict domain-whitelisted CORS validation, and HikariCP connection pooling tuned for serverless PostgreSQL sleep cycles.
- **Document Generation & Financial Reporting**: Developed automated financial reporting endpoints utilizing OpenPDF and custom CSV streaming, enabling users to schedule recurring expenses, set category budgets, and download generated spending summaries.
