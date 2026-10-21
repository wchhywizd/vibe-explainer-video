#!/bin/bash
# usage: render.sh page.html framesdir   → framesdir/f00000.jpg …（30fps，2 路并行，已存在的帧跳过，可断点续渲）
set -e
K=$(cd "$(dirname "$0")" && pwd); H=$(realpath "$1"); O=$(realpath -m "$2"); mkdir -p "$O"
PY=${PYTHON:-python3}
"$PY" "$K/render_frames.py" 0 2 "$H" "$O" > "$O.log0" 2>&1 &
"$PY" "$K/render_frames.py" 1 2 "$H" "$O" > "$O.log1" 2>&1 &
wait; echo "frames: $(ls "$O" | wc -l)"
