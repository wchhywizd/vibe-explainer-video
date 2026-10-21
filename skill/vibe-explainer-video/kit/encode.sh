#!/bin/bash
# usage: encode.sh framesdir music.wav sfx.wav outbase
#   → outbase.mp4（配乐版 −16 LUFS）· outbase-sfx-only.mp4（只音效 −20 LUFS）· outbase-cover.jpg（第 0 帧）
set -e
F=$1; M=$2; S=$3; O=$4; mkdir -p "$(dirname "$O")"
ln2() { # two-pass linear loudnorm: in target out
  J=$(ffmpeg -hide_banner -nostats -i "$1" -af loudnorm=I=$2:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
  g() { echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
  ffmpeg -y -hide_banner -loglevel error -i "$1" -af "loudnorm=I=$2:TP=-1.5:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" "$3"
}
ln2 "$M" -16 "$O.music-ln.wav"; ln2 "$S" -20 "$O.sfx-ln.wav"
ENC="-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 192k -shortest -movflags +faststart"
ffmpeg -y -hide_banner -loglevel error -framerate 30 -i "$F/f%05d.jpg" -i "$O.music-ln.wav" $ENC "$O.mp4"
ffmpeg -y -hide_banner -loglevel error -framerate 30 -i "$F/f%05d.jpg" -i "$O.sfx-ln.wav" $ENC "$O-sfx-only.mp4"
cp "$F/f00000.jpg" "$O-cover.jpg"; rm -f "$O.music-ln.wav" "$O.sfx-ln.wav"
for f in "$O.mp4" "$O-sfx-only.mp4"; do echo "$f $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")s $(ffmpeg -hide_banner -nostats -i "$f" -af ebur128 -f null - 2>&1 | grep -E '^\s+I:' | tail -1)"; done
