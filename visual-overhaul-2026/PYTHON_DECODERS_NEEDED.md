# Python Decoder Files - Location Needed

**Status:** Searching for Python reference implementations

## What We Need

The user mentioned Python decoder files exist with extensive test coverage:
- `resistor_decoder.py` (with 154 tests)
- `capacitor_decoder.py`
- `pedalpath_integration.py`

**Expected location:** Dropbox "Upload to Claude Code" directory

## Search Results

Searched locations:
- `/home/rob/Dropbox/` - No Python files found
- `/home/rob/Dropbox/!Claude/` - No Python files found
- Entire home directory - No matching files

## Action Needed

**User:** Please confirm the exact path to these Python files, or upload them to:
- `/home/rob/Dropbox/!Claude/` (recommended)
- Or: `/home/rob/git/pedalpath-v2/visual-overhaul-2026/reference-code/`

## Why We Need Them

Phase 1, Work Stream A (Component Decoders) should **port** these Python implementations to TypeScript rather than building from scratch. This ensures:
- Proven logic (154 tests = well-tested)
- Accurate color band calculations
- Consistent capacitor type determination
- Faster implementation (port vs rebuild)

## Temporary Approach

If Python files can't be located:
- Worker A can implement from scratch using the detailed specs in:
  - `1-requirements/component-visual-specs.md`
  - `2-technical-design/decoder-system-design.md`
- Create comprehensive test suite to match Python's 154 tests
- Risk: May miss edge cases that Python version handled

## Next Steps

1. User provides Python file location
2. Copy files to `/visual-overhaul-2026/reference-code/`
3. Update Phase 1 README with Python file location
4. Worker A reviews Python logic before implementing TypeScript version
