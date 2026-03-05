# Session 10 Continuation

## Where we stopped
Session 10 fixed two blocking iOS bugs (save modal + Upload→Plus icon) and investigated the IOMMIC BOOST mis-analysis. Rob is about to install a plugin.

## Pending after plugin install

### 1. Accuracy regressions (top priority)
```bash
cd /home/rob/pedalpath-v2
source /home/rob/.pedalpath_env
python3 tools/accuracy_test.py --circuit "Dart V2"
python3 tools/accuracy_test.py --circuit "Ratticus Turbo"
python3 tools/accuracy_test.py --circuit "SBB Stratoblaster"
```

Current failures:
- Dart V2 — 77.5% (was ~90% session 5, regressed)
- Ratticus Turbo — 76.1% (was 92.4% session 7, regressed)
- SBB Stratoblaster — 75.3% (was 85.3% session 7, regressed)
- Buff N Blend — 84.7% (0.3% from threshold — quick win)
- American Fuzz — 82.2%
- Black Dog v2 — 79.3%
- Sunburn V3 — 80.8%

### 2. IOMMIC BOOST ground truth
The circuit is a DAM B13 / Rangemaster-style Ge transistor boost.
Reference BOM is in `/mnt/c/Users/Rob/Dropbox/!PedalPath/_INBOX/IOMMIC BOOST 1.0.docx`
- Add as ground truth JSON if a clean schematic image can be sourced
- The uploaded PCB photo (IMG_7472.jpeg, 65% confidence) is not suitable for accuracy testing

### 3. Remaining backlog
- iOS Phase 8: `_INBOX/pedalpath-ios-web-shell-gh/` design tokens
- CollisionAlert: `src/components/sidebar/CollisionAlert.tsx`
- 1590A EnclosureGuide: wire up in `EnclosureGuide.tsx`
- Stripe launch prep (pending Rob env vars)
