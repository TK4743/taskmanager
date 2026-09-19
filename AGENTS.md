# Workspace Rules and Permanent Memory

## Dual GitHub Repository Sync Policy
Whenever code changes, bug fixes, or optimizations are made and committed to Git, they **MUST ALWAYS** be pushed to BOTH GitHub repositories:
1. `https://github.com/TK4743/taskmanager.git`
2. `https://github.com/Tharun4743/taskmanager.git`

The local Git `origin` remote has been configured with dual push URLs so running `git push origin main` automatically pushes to both repositories simultaneously.
Alternatively, push explicitly to both:
- `git push origin main`
- `git push tharun_taskmanager main`

Ensure both repositories always stay in 100% parity on every push.

## Render Repository Protection (STRICT)
- **NEVER** push to or modify the Render deployment repository: `https://github.com/Tharun4743/IT_taskmanager.git`
- All future commits, updates, and pushes must strictly target only `origin` (`TK4743/taskmanager.git` and `Tharun4743/taskmanager.git`).
