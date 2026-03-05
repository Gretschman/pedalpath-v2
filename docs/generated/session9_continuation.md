# Session 9 Continuation — Accuracy Regressions

## Where we stopped
Session 9 completed the full breadboard guide visual overhaul (Phases A+B+C).
All Coppersound gap analysis items are resolved. Rob is testing the live guide.

## Next: Accuracy regressions

### Priority order
1. **Dart V2** — 77.5% (was ~90% in session 5, regressed)
2. **Ratticus Turbo** — 76.1% (was 92.4% in session 7, regressed)
3. **SBB Stratoblaster** — 75.3% (was 85.3% in session 7, regressed)
4. **Buff N Blend** — 84.7% (0.3% from threshold — quick win)
5. **American Fuzz** — 82.2%
6. **Black Dog v2** — 79.3%
7. **Sunburn V3** — 80.8%

### How to start accuracy work
```bash
cd /home/rob/pedalpath-v2
source /home/rob/.pedalpath_env  # or python-dotenv loads it
python3 tools/accuracy_test.py --circuit "Dart V2"
python3 tools/accuracy_test.py --circuit "Ratticus Turbo"
python3 tools/accuracy_test.py --circuit "SBB Stratoblaster"
```

If a circuit isn't found by name, check the DB slug:
```bash
python3 tools/accuracy_test.py --list
```

### Regression hypothesis
Session 8 restored the original bias rule after "COMPLETELY ILLEGIBLE" language
caused regressions. But Dart V2, Ratticus Turbo, SBB are still below their session 5/7
scores. These may need circuit-specific schematic review with Claude Vision.

Ground truth PDFs are in: `/mnt/c/Users/Rob/Dropbox/!PedalPath/_REFERENCE/ground-truth/`

### After accuracy — remaining backlog
- iOS Phase 8: `_INBOX/pedalpath-ios-web-shell-gh/` design tokens
- CollisionAlert: `src/components/sidebar/CollisionAlert.tsx`
- 1590A EnclosureGuide: wire up in `EnclosureGuide.tsx`
- Stripe launch prep (pending Rob env vars)
