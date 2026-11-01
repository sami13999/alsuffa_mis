# Al Suffa Education System (MIS)

A full-stack enterprise School Management Information System (MIS) for **Al Suffa Education System**, engineered with strict Yarn Workspaces, Express/Node.js, MySQL 8.0 (19 relational tables), and React 18 / Tailwind CSS.

---

## 1. Monorepo Architecture & Technology Choices

- **Orchestration**: Yarn Workspaces (`backend`, `frontend`) with hoisted dependencies.
- **Backend**: Node.js + Express (Controller-Service-Routes modular pattern), `mysql2/promise` connection pooling, `dotenv`, `cors`, `jsonwebtoken`, `bcryptjs`.
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios (with JWT interceptors), Lucide-React icons.
- **Database Engine**: MySQL 8.0 on `127.0.0.1:3306`, Database: `school_management` (19 tables from `schema.sql`).

```text
alsuffa_mis/
├── .env                              # Master environment credentials
├── .gitignore                        # Version control ignores
├── package.json                      # Yarn Workspaces root configuration
├── README.md                         # Project documentation
├── schema.sql                        # 19-table DDL schema
├── test-db.js                        # Root database diagnostics
├── backend/
│   ├── package.json
│   ├── server.js                     # Express app & route mounting
│   ├── test-db.js                    # Direct CLI connection test
│   └── src/
│       ├── config/
│       │   ├── db.js                 # mysql2 connection pool
│       │   └── seed.js               # Database seeder script
│       ├── middleware/
│       │   ├── authMiddleware.js     # JWT verification & profile attachment
│       │   ├── roleMiddleware.js     # Role-based access control guard
│       │   └── errorHandler.js       # Centralized error handler
│       ├── utils/
│       │   └── responseFormatter.js  # Standardized API response wrappers
│       └── modules/
│           ├── auth/                 # Login, session verification
│           ├── academics/            # Sessions, classes, sections, subjects
│           ├── students/             # Admissions, enrollments, student records
│           ├── staff/                # Employee registration, payroll processing
│           ├── examinations/         # Exams, schedules, mass marks entry, report cards
│           ├── fees/                 # Fee heads, class pricing, bulk billing, POS collection, challans
│           ├── timetables/           # Timetable builder & collision prevention
│           └── dashboard/            # Role-specific executive metrics
└── frontend/
    ├── package.json
    ├── vite.config.js                # Port 3000 dev server
    ├── tailwind.config.js            # Tailwind typography & theme
    └── src/
        ├── api/axiosClient.js        # Axios instance with JWT interceptor
        ├── context/AuthContext.jsx   # Global session state & role helpers
        ├── layouts/
        │   ├── AuthLayout.jsx        # Login layout
        │   └── DashboardLayout.jsx   # Role-based Sidebar & Navbar
        ├── components/
        │   ├── Button.jsx            # Reusable button with variants & loaders
        │   ├── Input.jsx             # Accessible input with error state
        │   ├── Select.jsx            # Dynamic select dropdown
        │   ├── Modal.jsx             # Dialog overlay
        │   ├── Table.jsx             # Data table with empty states
        │   ├── Badge.jsx             # Color-coded status badges
        │   └── StatCard.jsx          # Metric statistic card
        └── modules/
            ├── auth/Login.jsx        # Authentication with 1-click demo switcher
            ├── admin/AdminDashboard.jsx     # Super Admin Dashboard
            ├── accounts/AccountsDashboard.jsx # Accounts & Financial Dashboard
            ├── teacher/TeacherDashboard.jsx   # Teacher Faculty Dashboard
            └── student/StudentPortal.jsx      # Student Portal
```

---

## 2. Pre-Seeded Demonstration Accounts

All demo accounts use password: `password123`

| Role | Username | Password | Purpose & Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `password123` | Executive metrics, campus hierarchy, student admissions, staff registration, timetable builder. |
| **Accountant** | `accountant` | `password123` | Financial stats, fee heads, bulk voucher generation, POS counter, 3-copy Challans, payroll disbursement. |
| **Teacher** | `teacher1` | `password123` | Senior Mathematics Lecturer. Teaching schedule, mass marks entry with pass/fail validation. |
| **Teacher** | `teacher2` | `password123` | Physics Lead. Teaching schedule, gradebook assessment. |
| **Student** | `student1` | `password123` | Hamza Farooq (Grade 9-A). View class timetable, fee vouchers, printable challans, report cards. |
| **Student** | `student2` | `password123` | Fatima Zahra (Grade 9-A). View student schedule, unpaid fee vouchers, report card. |

---

## 3. Quick Start & Execution Commands

### Step A: Install Workspace Dependencies
```bash
yarn install
```

### Step B: Seed Database (Fresh Data)
```bash
yarn seed
```

### Step C: Run Both Backend & Frontend Concurrently
```bash
yarn dev
```
- **Backend API**: `http://localhost:5000`
- **Frontend UI**: `http://localhost:3000`

### Step D: Build for Production
```bash
yarn build
```

### Step E: Test Database Connection Directly
```bash
node test-db.js
```
