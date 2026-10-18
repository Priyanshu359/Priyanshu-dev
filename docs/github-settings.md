# GitHub Repository Security & Settings Guide

This document specifies the exact settings to configure in GitHub for the `priyanshu-dev` repository to enforce production security, branch protection, code quality gates, and automated deployment guards.

---

## 1. Branch Protection Rules (`main`)

Navigate to **Settings** → **Branches** → **Add classic branch protection rule** (or **Branch rulesets**):

* **Branch name pattern**: `main`

### Required Checkboxes:
1. **Require a pull request before merging**
   - **Required approvals**: `1` (or leave unchecked if you are the sole author, but PRs are still required to trigger preview deployments and CI).
   - **Dismiss stale pull request approvals when new commits are pushed**: Checked.
   - **Require review from Code Owners**: Optional.

2. **Require status checks to pass before merging**
   - **Require branches to be up to date before merging**: Checked (prevents race conditions and semantic merge conflicts).
   - **Status checks that must pass**:
     - `Web (Next.js) - Lint, Test & Build` (`web`)
     - `API (Spring Boot) - Tests & Package` (`api`)
     - `Security Scan (Gitleaks)` (`security`)

3. **Require conversation resolution before merging**: Checked.
4. **Require signed commits**: Optional (recommended if GPG is configured).
5. **Require linear history**: Checked (keeps git log clean with rebase or squash merges).
6. **Do not allow bypassing the above settings**: Checked (enforces rules even for repository owners/administrators).
7. **Restrict who can push to matching branches**: Checked.
8. **Do not allow force pushes (`git push --force`)**: Checked.
9. **Do not allow deletions**: Checked.

---

## 2. GitHub Actions Permissions & Fork Protection

Navigate to **Settings** → **Actions** → **General**:

### Fork Pull Request Protection
Under **Fork pull request workflows from outside collaborators**:
* Select **Require approval for first-time contributors who are new to GitHub** (or **Require approval for all outside collaborators**).
* *Why this matters*: Protects your GitHub Actions runner minutes and environment secrets from being abused by arbitrary malicious pull requests submitted from forks.

### Workflow Permissions
* Select **Read and write permissions** (needed for GitHub Actions to push Docker images to GitHub Container Registry `ghcr.io`).
* Check **Allow GitHub Actions to create and approve pull requests** (for Dependabot auto-merges).

---

## 3. Two-Factor Authentication (2FA) Requirement

Navigate to **Settings** → **Collaborators** (or Organization Settings → **Security**):
* Enforce **Two-factor authentication requirement**.
* Any contributor or maintainer account must have an active authenticator app (TOTP) or hardware security key (FIDO2/WebAuthn).

---

## 4. Secret Scanning & Dependabot

Navigate to **Settings** → **Code security and analysis**:
* **Dependency graph**: Enabled.
* **Dependabot alerts**: Enabled.
* **Dependabot security updates**: Enabled.
* **Secret scanning**: Enabled (automatically checks for pushed AWS/OpenAI/database tokens).
* **Push protection**: Enabled (blocks commits containing unencrypted secrets at git push time).

---

## 5. Repository Secrets for Deployment

Navigate to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret Name | Description | Example / Note |
|---|---|---|
| `VM_HOST` | Public IPv4 address of your Oracle Cloud VM | `129.153.xx.xx` |
| `VM_USER` | SSH user for the VM | `ubuntu` |
| `VM_SSH_KEY` | Private SSH key (PEM / OpenSSH format) | Output of `~/.ssh/id_ed25519` |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key | `0x4AAAAAA...` (from Cloudflare dashboard) |

---

## Verification
- Create a test branch `test-branch`, make a commit, and try to run `git push origin main --force`. The push **must be rejected** with `remote: error: GH006: Protected branch update failed`.
- Open a Pull Request from `test-branch` to `main`. Verify that the three CI checks (`web`, `api`, `security`) start and run automatically.
