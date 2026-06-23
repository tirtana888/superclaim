#!/usr/bin/env python3
"""SuperClaim - Compatibility & Consistency Checker.

Run: python scripts/check_compat.py

Performs static checks (no server required) to catch cross-module drift early:
  - canonical schemas defined exactly once
  - service entrypoints follow the locked contract
  - stray camelCase in backend code
  - queries that may be missing tenant filtering
  - broken local imports / syntax errors
  - models present without any Alembic migration

ERRORS must be fixed before a task is considered done. WARNINGS should be
reviewed. Output is ASCII-only so it runs cleanly on Windows and Linux CI.
"""

from __future__ import annotations

import ast
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"

errors: list[str] = []
warnings: list[str] = []


def add_err(msg: str) -> None:
    errors.append(f"[ERROR] {msg}")


def add_warn(msg: str) -> None:
    warnings.append(f"[WARN]  {msg}")


# 1) Service entrypoint signatures should follow the locked contract.
#    Reported as WARNING: services predate the contract and are migrated to the
#    canonical entrypoint names per dedicated session, not all at once.
EXPECTED_SERVICE_FUNCS = {
    "vision_service.py": "analyze",
    "ocr_service.py": "extract",
    "duplicate_service.py": "check",
    "policy_engine.py": "evaluate",
    "fraud_service.py": "score",
    "decision_service.py": "decide",
}
services_dir = APP / "services"
if services_dir.exists():
    for fname, func in EXPECTED_SERVICE_FUNCS.items():
        fpath = services_dir / fname
        if not fpath.exists():
            add_warn(f"{fname} not created yet (filled in its dedicated session)")
            continue
        src = fpath.read_text(encoding="utf-8")
        if f"def {func}(" not in src and f"async def {func}(" not in src:
            add_warn(
                f"{fname} does not yet expose canonical entrypoint '{func}()' "
                "(see app/schemas/results.py contract)"
            )

# 2) Canonical schemas must be defined exactly once.
canonical = [
    "VisionResult",
    "OCRResult",
    "DuplicateResult",
    "PolicyResult",
    "FraudResult",
    "ClaimAnalysisResult",
]
defs: dict[str, list[str]] = {c: [] for c in canonical}
for py in APP.rglob("*.py"):
    src = py.read_text(encoding="utf-8")
    for c in canonical:
        if re.search(rf"class {c}\b", src):
            defs[c].append(str(py.relative_to(ROOT)))
for c, locs in defs.items():
    if len(locs) == 0:
        add_warn(f"canonical schema '{c}' not defined yet (add to app/schemas/results.py)")
    elif len(locs) > 1:
        add_err(f"schema '{c}' defined {len(locs)}x (must be once): {locs}")

# 3) Detect stray camelCase in backend (snake_case only).
camel = re.compile(r"\b[a-z]+[A-Z][a-zA-Z]*\s*[:=]")
allow = {"isInstance", "isSubclass"}
for py in APP.rglob("*.py"):
    for i, line in enumerate(py.read_text(encoding="utf-8").splitlines(), 1):
        stripped = line.strip()
        if stripped.startswith("#"):
            continue
        for m in camel.finditer(line):
            tok = m.group().rstrip(":= ").strip()
            if tok not in allow and "_" not in tok:
                add_warn(
                    f"{py.relative_to(ROOT)}:{i} possible camelCase '{tok}' "
                    "(backend must be snake_case)"
                )
                break

# 4) Queries without tenant filtering (heuristic).
for py in APP.rglob("*.py"):
    rel = str(py)
    if "schemas" in rel or "migrations" in rel or "alembic" in rel:
        continue
    src = py.read_text(encoding="utf-8")
    if "select(" in src and "tenant" not in src:
        add_warn(
            f"{py.relative_to(ROOT)} uses select() but never mentions 'tenant' "
            "- verify tenant isolation"
        )

# 5) Broken local imports / syntax errors.
local_mods = {
    str(p.relative_to(APP)).replace("\\", "/").replace("/", ".").replace(".py", "")
    for p in APP.rglob("*.py")
}
for py in APP.rglob("*.py"):
    try:
        tree = ast.parse(py.read_text(encoding="utf-8"))
    except SyntaxError as e:
        add_err(f"syntax error in {py.relative_to(ROOT)}:{e.lineno} - {e.msg}")
        continue
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module and node.module.startswith("app."):
            mod = node.module.replace("app.", "")
            if mod not in local_mods and not any(m.startswith(mod) for m in local_mods):
                add_warn(f"{py.relative_to(ROOT)} imports 'app.{mod}' which does not exist")

# 6) Models present but no Alembic migration at all.
models_dir = APP / "models"
migrations_dir = ROOT / "alembic" / "versions"
if models_dir.exists() and migrations_dir.exists():
    n_models = len([p for p in models_dir.rglob("*.py") if p.name != "__init__.py"])
    n_migr = len(list(migrations_dir.glob("*.py")))
    if n_models > 0 and n_migr == 0:
        add_err("models exist but there are no Alembic migrations")

# ---- Report ----
print("=" * 60)
print("  SuperClaim - Compatibility Check")
print("=" * 60)
if errors:
    print(f"\n{len(errors)} ERROR(s) (must fix):")
    for e in errors:
        print("  " + e)
if warnings:
    print(f"\n{len(warnings)} WARNING(s) (review):")
    for w in warnings[:30]:
        print("  " + w)
    if len(warnings) > 30:
        print(f"  ... and {len(warnings) - 30} more")
if not errors and not warnings:
    print("\nAll compatibility checks passed.")
print()
sys.exit(1 if errors else 0)
