# Replit Deployment Configuration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Configure the Flask application for automated deployment on Replit.

**Architecture:** We will create a `.replit` file to automate workspace startup commands and update the Flask entrypoint in `main.py` to read port bindings from the `PORT` environment variable dynamically.

**Tech Stack:** Python, Flask, Replit config.

---

### Task 1: Replit Workspace Configuration

**Files:**
- Create: `.replit`

**Step 1: Create the Replit configuration file**
Create `.replit` in the workspace root:
```toml
run = "python main.py"

[nix]
channel = "stable-23_05"
```

**Step 2: Verify config file created**
Ensure the file `.replit` exists in the project root directory.

**Step 3: Commit**
```bash
git add .replit
git commit -m "feat: add .replit configuration file for automated workspace execution"
```

---

### Task 2: Dynamic Port Binding in main.py

**Files:**
- Modify: `main.py`

**Step 1: Update Flask entrypoint**
Modify the startup block at the bottom of [main.py](file:///c:/Users/oneda/Projects/nusantara-palm-sentinel-mvp/main.py) to read `PORT` from environment variables:
```python
import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
```

**Step 2: Run syntax verification check**
Run: `python -m py_compile main.py`
Expected: Passes without errors.

**Step 3: Verify unittest calculations suite**
Run: `python -m unittest tests/test_agronomy.py`
Expected: OK.

**Step 4: Commit**
```bash
git add main.py
git commit -m "feat: use PORT environment variable for dynamic binding in main.py"
```

---

### Task 3: Local Environment Verification

**Files:**
- None

**Step 1: Run the server on a custom port locally**
Run:
```powershell
$env:PORT="5001"
python main.py
```

**Step 2: Confirm server is reachable on port 5001**
Verify that the local app is reachable on `http://127.0.0.1:5001/` by requesting the index route or verification.

**Step 3: Stop the server**
Stop the running task / process.
