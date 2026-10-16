#!/usr/bin/env python3
"""Loudness timeline + transient onsets for a WAV (mono or stereo, 16-bit). Pure stdlib.

Use it to study a reference video's sound design and to compare your render against it:
    npx remotion ffmpeg -i ref.mp4 -vn -ac 1 -ar 48000 -c:a pcm_s16le ref.wav
    python3 -I .claude/skills/launch-reel/scripts/audio_profile.py ref.wav [mine.wav]
Prints RMS dB per 0.5 s and the onset times (clicks, keys, typing, cuts) for each file.
"""
import math, statistics, struct, sys, wave

def load(path):
    w = wave.open(path)
    n, ch = w.getnframes(), w.getnchannels()
    data = struct.unpack("<%dh" % (n * ch), w.readframes(n))
    return [v / 32768 for v in data[::ch]], w.getframerate()

for path in sys.argv[1:]:
    x, sr = load(path)
    blk = sr // 2
    rms = [math.sqrt(sum(v * v for v in x[i:i + blk]) / blk) for i in range(0, len(x) - blk, blk)]
    print(path)
    print("  dB/0.5s:", " ".join(f"{20 * math.log10(r + 1e-9):4.0f}" for r in rms))
    hop = int(sr * 0.005)
    hf = []
    for i in range(0, len(x) - hop, hop):
        seg = x[i:i + hop]
        hf.append(math.sqrt(sum((seg[j] - seg[j - 1]) ** 2 for j in range(1, hop)) / hop))
    onsets, last = [], -100
    for k in range(20, len(hf)):
        base = statistics.median(hf[k - 20:k]) + 1e-5
        if hf[k] > base * 4 and hf[k] > 0.004 and (k - last) * 0.005 > 0.06:
            onsets.append(round(k * 0.005, 2))
            last = k
    print(f"  onsets ({len(onsets)}):", " ".join(map(str, onsets)))
    print("  peak dBFS:", round(20 * math.log10(max(abs(v) for v in x) + 1e-9), 1))
