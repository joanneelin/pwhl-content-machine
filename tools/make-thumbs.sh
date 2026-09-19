#!/bin/sh
# Builds lighter copies of the clip thumbnails (macOS, uses the built-in `sips`).
#   assets/thumbs/sm/  ~270px wide  -> moment cards
#   assets/thumbs/md/  ~540px wide  -> phone preview poster
# Re-run after adding thumbnails, then run `node tools/build-data.mjs`.
set -e
cd "$(dirname "$0")/.."
mkdir -p assets/thumbs/sm assets/thumbs/md
for f in assets/thumbs/*.jpg; do
  name=$(basename "$f")
  sips --resampleWidth 270 -s format jpeg -s formatOptions 72 "$f" --out "assets/thumbs/sm/$name" >/dev/null
  sips --resampleWidth 540 -s format jpeg -s formatOptions 74 "$f" --out "assets/thumbs/md/$name" >/dev/null
done
echo "thumbs: $(ls assets/thumbs/sm | wc -l | tr -d ' ') small, $(ls assets/thumbs/md | wc -l | tr -d ' ') medium"
