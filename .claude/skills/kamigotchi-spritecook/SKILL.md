---
name: kamigotchi-spritecook
description: Use this skill whenever a Kamigotchi task involves SpriteCook - generating or editing game art (items, skill icons, NPCs, room backgrounds, marketing images), uploading repo sprites to SpriteCook, cleaning up SpriteCook output, or updating spritecook-assets.json. Use it together with the SpriteCook plugin skills (spritecook-workflow-essentials, spritecook-generate-sprites, spritecook-upload-assets).
---

# Kamigotchi + SpriteCook

All team instructions live in **`spritecook-assets.json` -> `agent_instructions`** at the repo root. Read that section in full before any SpriteCook call and follow it exactly. It is the single source of truth, so don't duplicate it here.

Key points in case of doubt:
- This repo is open source. Never write prompts, style/theme strings or descriptive notes into the repo.
- Use only the current user's asset IDs (`asset_ids.<github-name>`). If they have none yet, follow `agent_instructions.setup_per_teammate`.
- Finish every SpriteCook result with `scripts/art/spritecook_cleanup.py` (Python 3 + Pillow) and the `verification_checklist`.
