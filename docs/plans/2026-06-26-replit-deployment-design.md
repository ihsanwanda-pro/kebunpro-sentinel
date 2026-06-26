# Design Document: Robust Nix-Only Replit Deployment

This document defines the architecture for deploying the Flask version of the Nusantara Palm-Estate Operations Planner & Sentinel (`main.py`) to Replit Autoscale using a pure Nix environment.

---

## 1. Goal
Achieve a stable, repeatable deployment on Replit Autoscale without encountering package installation errors (externally-managed-environment / PEP 668), slow pip installations, or state synchronization bugs between Git and Replit's UI.

---

## 2. Analysis of Approaches

### Approach A: Replit Agent's PIP-based Workaround (Not Recommended)
The Replit Agent configured environment variables (`PYTHONUSERBASE=/home/runner/workspace/.pythonlibs`, `PIP_USER=1`) and a custom `start.sh` script to run pip during deployment.
- **Issues**:
  - **Out-of-band Settings**: Environment variables are configured in Replit's database/UI and are not version-controlled in Git. If you recreate the Repl or clone it, these settings are lost.
  - **Diverged Codebase**: Pushing from Git deletes or overrides files like `start.sh` or `requirements.txt` unless they are explicitly managed, leading to a broken pipeline.
  - **Brittle Builds**: Downloading packages via pip during deployment is slow and susceptible to network failures.

### Approach B: Declarative Nix-Only Configuration (Recommended)
We define all dependencies in `replit.nix` and control the deployment commands strictly via `.replit`.
- **Advantages**:
  - **Version-Controlled**: Every setting is in Git.
  - **Zero Compilation/Download**: Nix packages are pre-compiled and immediately available in the deployment container.
  - **No PIP Errors**: Since we don't run pip, we completely bypass PEP 668 `/nix/store` immutability issues.

---

## 3. Proposed Changes

### A. Rename requirements.txt
Rename `requirements.txt` to `requirements-dev.txt` in the Git repository.
- **Purpose**: Prevents Replit's auto-detect system from triggering an automatic `pip install` run when it sees `requirements.txt` in the project root.

### B. Declare dependencies in `replit.nix`
Update `replit.nix` to include `pandas` which is used by `/api/audit`:
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

### C. Configure `.replit`
Ensure the configuration specifies the deployment run target and contains NO build steps:
```toml
run = "python main.py"

[nix]
channel = "stable-23_05"

[deployment]
deploymentTarget = "autoscale"
run = ["gunicorn", "--bind=0.0.0.0:5000", "--reuse-port", "main:app"]
```

---

## 4. Verification Plan

### Automated / Local Checks
1. Validate that the app runs locally with the Nix packages:
   `python main.py`
2. Ensure the `/api/audit` route loads correctly (verifies `pandas` import works).

### Deployment Check
1. Push the configuration to GitHub.
2. In Replit, pull the latest changes.
3. Ensure the Replit Deployment settings have **no custom Build Command** and **no custom Environment Variables** (since everything is handled by `replit.nix`).
4. Publish and verify the application successfully starts.
