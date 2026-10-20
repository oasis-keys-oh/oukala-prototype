# Journey box images

Drop image files in this folder (webp, jpg or png, about 800 x 500) and list them in manifest.json.
Each journey step shows its image in grey and faded, and in full colour on hover.

Keys, most specific first:
  "JH3-07": "ed-triage.webp"        one step, by its trace number (shown on the card)
  "tp:ELIG": "coverage.webp"        every step at a shared touchpoint
  "persona:Nurse": "nurse.webp"     every step done by a persona
  "default": "generic.webp"         anything else

Without an image a step shows a tinted placeholder. Use only images you have the right to use.

Rules (JM-06): the first key that matches wins, in the order above. tp: and persona: keys ignore case. Touchpoint keys are the
JYX.TP keys (every scenario has them: for example PORTAL, APPR, ALARM, WO, CASE, QUOTE, ELIG, BED). A key that starts with "_" is a
comment and an empty value is skipped, so placeholders stay until a real file is listed. JXR.imgKey(step) tells which key a step uses;
JXR.setManifest({...}) loads a manifest without a fetch (a page opened from a file cannot fetch this one). No images ship with the prototype.
