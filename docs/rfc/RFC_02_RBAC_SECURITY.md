# RFC-02: Multi-Tier RBAC Architecture

- Roles: SuperAdmin, DepartmentHOD, FacultyMentor, Student
- Enforcement: Middleware JWT claim verification + PostgreSQL RLS
- Verification: 100% route coverage verified