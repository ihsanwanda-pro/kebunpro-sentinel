# Replit Deployment Configuration Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Configure the Flask application for robust Nix-only deployment on Replit.

**Architecture:** Rename `requirements.txt` to `requirements-dev.txt` to disable automatic pip installs, add `pandas` to `replit.nix`, and configure gunicorn via `.replit` without start scripts.

**Tech Stack:** Nix, Replit config, Flask.

---

### Task 1: Rename requirements.txt

**Files:**
- Modify: Rename `requirements.txt` -> `requirements-dev.txt`

**Step 1: Rename file locally**
Run: `Rename-Item -Path "c:\Users\oneda\Projects\nusantara-palm-sentinel-mvp\requirements.txt" -NewName "requirements-dev.txt"`
Expected: File is renamed, `requirements.txt` no longer exists in root.

**Step 2: Commit**
```bash
git add requirements.txt requirements-dev.txt
git commit -m "refactor: rename requirements.txt to requirements-dev.txt to bypass Replit pip auto-install"
```

---

### Task 2: Declare pandas Dependency in replit.nix

**Files:**
- Modify: `replit.nix`

**Step 1: Add pandas package to dependencies**
Edit [replit.nix](file:///c:/Users/oneda/Projects/nusantara-palm-sentinel-mvp/replit.nix) to include `pkgs.python310Packages.pandas`:
```nix
{ pkgs }: {
  deps = [
    pkgs.python310
    pkgs.python310Packages.flask
    pkgs.python310Packages.requests
    pkgs.python310Packages.pandas
    pkgs.python310Packages.gunicorn
  ];
}
```

**Step 2: Verify local execution using Nix deps**
Run the application server locally to verify imports compile:
`python main.py`
Expected: Server starts on port 5000 successfully.

**Step 3: Commit**
```bash
git add replit.nix
git commit -m "fix: declare pandas in replit.nix for audit route support"
```

---

### Task 3: Setup .replit File Configuration

**Files:**
- Modify: `.replit`

**Step 1: Check `.replit` contents**
Ensure `.replit` contains only the required execution variables:
```toml
run = "python main.py"

[nix]
channel = "stable-23_05"

[deployment]
deploymentTarget = "autoscale"
run = ["gunicorn", "--bind=0.0.0.0:5000", "--reuse-port", "main:app"]
```

**Step 2: Commit any changes if made**
```bash
git add .replit
git commit -m "config: configure autoscale deployment target and gunicorn runtime in .replit"
```
