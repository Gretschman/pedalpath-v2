# PedalPath v2

Guitar pedal schematic analyzer: upload schematic → Claude Vision → BOM + visual build guides.

**Repo**: /home/rob/pedalpath-v2 (WSL)
**Secrets**: /home/rob/.pedalpath_env (never commit)
**Deploy**: https://pedalpath.app | https://pedalpath-app.vercel.app

---

## Current Status

**Session 9 complete (2026-03-05). 172 tests passing. Live at pedalpath.app.**

**Completed session 9:**
- ✅ Breadboard guide full rewrite — 11 type-sorted steps → 6 circuit-functional sections (power→input→active→clipping→tone→output)
- ✅ Each step has a WHY explanation of the circuit section's electrical purpose
- ✅ Cumulative board view: components accumulate step by step; current step glows amber; future components hidden
- ✅ `BomSection` type + Rule 8 in Claude prompt — components now classified by circuit function at analysis time
- ✅ Component thumbnail orientation fixes: electrolytic/tantalum upright cylinder, film cap upright portrait box, resistor U-bent leads
- ✅ Output wire color corrected: orange → blue (matches wire color scheme)
- ✅ ResistorReference panel: IEC 60062 color band table + per-build resistor gallery (collapsible, data-driven)
- ✅ CapMarkingExplainer panel: EIA 3-digit code + direct notation, with worked examples (collapsible)
- ✅ Reviewed 2 new Coppersound guides (Treble Boost, MOSFET Boost) — all gaps now addressed
- ✅ Session hygiene: ground-truth path updated (_INBOX→_REFERENCE), CLAUDE.md protocols added

**Completed session 8:**
- ✅ Analyzed `schematics and BOM_03.04.2026.docx` — 31 images, 12 circuits extracted and mapped
- ✅ New tool `tools/analyze_docx_circuits.py` — uploads docx schematics to API, compares to reference BOMs, reports variances
- ✅ Prompt improvements: 500pF to cap list, LM308/2N7000/BC109/BC184C notes, resistor ref≠value rule, Ge/Si diode notes
- ✅ Full accuracy test run: total 18/33 passing (Bass OD 92.5%, WattAmp 87.9%, Three Time Champ 94.2%)

**⚠️ ACTION REQUIRED (Rob):** Ask your company engineer to rotate the Anthropic API key
— it was exposed in a screenshot. Generate new key at console.anthropic.com → API Keys.

**When ready to charge (Stripe):**
Set these 5 env vars in Vercel Dashboard, then register the webhook:
1. `STRIPE_SECRET_KEY` — Stripe Dashboard → Developers → API keys
2. `STRIPE_WEBHOOK_SECRET` — Stripe Dashboard → Webhooks (after creating endpoint)
3. `SUPABASE_SERVICE_ROLE_KEY` — Supabase → Settings → API → service_role
4. `VITE_APP_URL` = `https://pedalpath.app`
5. `VITE_STRIPE_PRO_PRICE_ID` — Stripe Dashboard → Product catalog
Webhook endpoint: `https://pedalpath.app/api/stripe-webhook`
To re-enable quota at launch: uncomment 2 clearly marked lines in `src/pages/UploadPage.tsx`

**Next session priority order:**
1. **Accuracy regressions** — Dart V2 77.5% (was ~90%), Ratticus Turbo 76.1% (was 92.4%), SBB 75.3% (was 85.3%)
2. **Buff N Blend** 84.7% — 0.3% from threshold, quick win
3. **American Fuzz** 82.2%, **Black Dog** 79.3%, **Sunburn** 80.8%
4. **iOS Phase 8** — integrate `_INBOX/pedalpath-ios-web-shell-gh/` design tokens + native-feel UI
5. **Phase 4 sidebar CollisionAlert** — `src/components/sidebar/CollisionAlert.tsx`
6. **1590A EnclosureGuide** — wire up 1590A spec + east/west jacks in EnclosureGuide.tsx

**Reference images**: /mnt/c/Users/Rob/Dropbox/!PedalPath/_REFERENCE/

---

## Commands

```bash
cd /home/rob/pedalpath-v2/pedalpath-app
npm test -- --run    # run all tests
npm run build        # TypeScript check
npm run dev          # localhost:5173
vercel --prod --yes  # deploy
```

---

## Key Paths

- App source: `pedalpath-app/src/`
- Component SVGs: `src/components/visualizations/components-svg/`
- Decoders: `src/utils/decoders/`
- Tests: `src/utils/**/__tests__/`
- Upload queue / Inbox: `/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX` (drop files here from Windows)
- Reference library: `/mnt/c/Users/Rob/Dropbox/!PedalPath/_REFERENCE/` — breadboard-specs/, transistor-reference/, offboard-wiring/, drill-templates/, circuit-library/, demo-circuits/
- Session docs: `docs/generated/session_log.md`

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
- `tools/corrections_report.py` — queries user-submitted component corrections, groups by error pattern, outputs prompt action items
- `tools/verify_alignment.py` — MB-102 mechanical audit: verifies coordinate-to-grid mapping + Matrix-5 power rail positions
- `start_session.sh` — runs all sync tools + git status before starting Claude Code

---

## Session Startup Protocol (run at the start of EVERY session)

1. Run `bash start_session.sh` — syncs issues + upload queue + git status
2. Read `docs/generated/session_log.md`
3. Generate a project status summary (accuracy results, open issues, priorities, Rob action items)
4. Write summary to `_OUTPUT/pedalpath-status-YYYY-MM-DD.txt`
5. Display the same summary in chat — Rob reviews and selects priorities before work begins

## Break / End-of-Session Protocol (TRIGGER: Rob says "break", "take a break", "we need a break", or any similar phrase)

Execute immediately, in order — speed matters:
1. `git add` changed files + `git commit` with descriptive message + `Co-Authored-By` trailer
2. `git push`
3. `vercel --prod --yes` (only if app source code changed)
4. Update `docs/generated/session_log.md` with what was done
5. Write `docs/generated/session_N_continuation.md` — where we stopped, what's next, exact commands to resume
6. Write project summary to `_OUTPUT/pedalpath-status-YYYY-MM-DD.txt`
7. Display summary in chat
8. Confirm: "Session saved. Safe to close."

This same end-of-session sequence applies when a session ends normally, not just on break.

## Folder Paths

- **Inbox** (`_INBOX`): `/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX` — Rob drops files here from Windows
- **Output** (`_OUTPUT` / outbox): `/mnt/c/Users/Rob/Dropbox/!PedalPath/_OUTPUT` — write files for Rob to read on PC
- **Reference** (`_REFERENCE`): `/mnt/c/Users/Rob/Dropbox/!PedalPath/_REFERENCE` — permanent reference library
- **Inbox hygiene**: when done with a file — delete if one-time use, move to `_REFERENCE` subfolder if ongoing resource

## Rules

- Co-author all commits: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- Every new tool: add one line to **Tools Available** above immediately after creation
- Tool secrets: load from `/home/rob/.pedalpath_env` via python-dotenv
- Tool output: `docs/generated/` (not committed to git)
- Never commit `.env.local` or `.pedalpath_env`
