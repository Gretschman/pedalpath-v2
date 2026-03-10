# PedalPath v2

Guitar pedal schematic analyzer: upload schematic → Claude Vision → BOM + visual build guides.

**Repo**: /home/rob/pedalpath-v2 (WSL) | **Secrets**: /home/rob/.pedalpath_env (never commit)
**Deploy**: https://pedalpath.app | https://pedalpath-app.vercel.app

---

## Commands

```bash
cd /home/rob/pedalpath-v2/pedalpath-app
npm test -- --run      # run all tests
npm run build          # TypeScript check
npm run dev            # localhost:5173
vercel --prod --yes    # deploy
```

---

## Key Paths

| Path | Purpose |
|---|---|
| `pedalpath-app/src/` | App source |
| `src/components/visualizations/components-svg/` | Component SVG sprites |
| `src/utils/decoders/` | Value decoders (154 tests — do not rewrite) |
| `src/utils/**/__tests__/` | Tests |
| `docs/generated/` | Tool output (not committed) |
| `docs/stripe-launch-checklist.md` | Stripe launch steps |
| `/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX` | Rob drops files here from Windows |
| `/mnt/c/Users/Rob/Dropbox/!PedalPath/_OUTPUT` | Write files for Rob to read on PC |
| `/mnt/c/Users/Rob/Dropbox/!PedalPath/_REFERENCE` | Permanent reference library |

---

## Tools Available

- `tools/check_prereqs.py` — checks all dev prerequisites
- `tools/sync_github_issues.py` — pulls open GitHub issues → docs/generated/issues_current.md
- `tools/sync_upload_queue.py` — scans upload-queue/, extracts previews → docs/generated/session_manifest.md
- `tools/session_end.py` — stages, commits, pushes at session end (interactive or -m "msg")
- `tools/export_doc.py` — converts markdown → .docx with Rob's header/footer spec
- `tools/sync_supabase_schema.py` — dumps live Supabase schema → docs/generated/supabase_schema.sql
- `tools/populate_ground_truth.py` — seeds reference_circuits + reference_bom_items from _INBOX/ground-truth/*.json
- `tools/populate_supplier_links.py` — upserts supplier_links from _INBOX/ground-truth/supplier_links.json
- `tools/analyze_docx_circuits.py` — uploads docx schematic images to API, compares generated vs reference BOMs, reports variances
- `tools/accuracy_test.py` — runs BOM accuracy tests against reference circuits; files GitHub issues for <85% scores
- `tools/corrections_report.py` — queries user-submitted corrections, groups by error pattern, outputs prompt action items
- `tools/verify_alignment.py` — MB-102 mechanical audit: verifies coordinate-to-grid mapping + Matrix-5 power rail positions
- `tools/inbox_hygiene.py` — auto-archives/deletes stale _INBOX files; runs at every session start
- `tools/update_session_state.py` — auto-refreshes Production State block in SESSION_STATE.md; call at session end
- `pedalpath-app/api/consume-credit.ts` — serverless endpoint: POST {userId} → checks + deducts 1 credit via creditGate
- `start_session.sh` — runs ALL sync tools + inbox hygiene + git status before starting work; prints SESSION_STATE.md first

---

## Session Startup Protocol (EVERY session — no exceptions)

1. Run `bash start_session.sh` — syncs issues, upload queue, inbox hygiene, git status
2. Read `docs/generated/session_log.md` — status, accuracy results, priorities, Rob action items
3. Read `docs/generated/session_manifest.md` — any new files Rob dropped in _INBOX
4. Generate a project status summary and display it in chat
5. Write summary to `_OUTPUT/pedalpath-status-YYYY-MM-DD.txt`
6. **Wait for Rob to confirm priorities before writing any code**

---

## Break / End-of-Session Protocol

**TRIGGER**: Rob says "break", "take a break", "end session", or similar. Execute immediately in order:

1. `git add` changed files + `git commit` with descriptive message + Co-Authored-By trailer
2. `git push`
3. `vercel --prod --yes` (only if app source changed)
4. Update `docs/generated/session_log.md` — what was done, current accuracy scores, next priorities
5. Write `docs/generated/session_N_continuation.md` — where stopped, what's next, exact resume commands
6. Write `_OUTPUT/pedalpath-status-YYYY-MM-DD.txt`
7. Display summary in chat
8. Confirm: "Session saved. Safe to close."

---

## Architecture — Read Before Touching Visual Code

**Component visualization**: Sprite-library + decorator model. Static SVGs per physical appearance in `src/components/visualizations/components-svg/`. Dynamic decoration (resistor bands, cap body type, LED color) via decorator engine wired to existing decoders. Do NOT use parameterized templates — they cannot represent distinct physical packages accurately.

**Schematic pipeline**: Four-tier processing — (0) pHash cache, (1) Python CV on Modal, (2) Gemini 2.0 Flash, (3) Claude Sonnet. See `PEDALPATH_ARCHITECTURE.md` for full spec.

**AI output contract**: Every analyzed component must include `ref`, `type`, `value`, `package`, `polarized`, `quantity`, `notes`, `confidence`. See `PEDALPATH_PRD.md` for full `AnalyzedComponent` interface.

---

## Rules

- Co-author all commits: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Every new tool: add one line to **Tools Available** above immediately after creation
- Tool secrets: load from `/home/rob/.pedalpath_env` via python-dotenv
- Tool output: `docs/generated/` (not committed to git)
- Never commit `.env.local` or `.pedalpath_env`
- Inbox auto-hygiene runs via `start_session.sh` — never leave processed files in _INBOX
- Do not begin Stripe integration until component visualization and breadboard rendering are complete
- **Platform: desktop-first** — Windows (Chrome/Edge) + macOS (Safari/Chrome) equally. No mobile/PWA/iOS work until Stripe is live. `pedalpath-ios-web-shell-gh` is archived backlog — do not activate it.
