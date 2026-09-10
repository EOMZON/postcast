#!/usr/bin/env bash
set -euo pipefail

# Local transcription using the existing Whisper venv in ../10_music (no network).
#
# Usage:
#   bash scripts/local_whisper_transcribe.sh "audio/_local/stems/htdemucs/<slug>/vocals.wav" [out_dir]
#
# Tip: transcribing vocals.wav (after Demucs) reduces background-music interference.

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_DIR}"

INPUT="${1:-}"
OUT_DIR="${2:-}"

if [[ -z "${INPUT}" ]]; then
  echo "Usage: $0 <audio file> [out_dir]" >&2
  exit 1
fi
if [[ ! -f "${INPUT}" ]]; then
  echo "Audio file not found: ${INPUT}" >&2
  exit 1
fi

if [[ -z "${OUT_DIR}" ]]; then
  base="$(basename "${INPUT}")"
  OUT_DIR="transcripts/${base%.*}"
fi

mkdir -p "${OUT_DIR}"

WHISPER_BIN="${WHISPER_BIN:-../../../10_music/venv/bin/whisper}"
MODEL_DIR="${MODEL_DIR:-../../../tmp/whisper-cache/whisper}"
MODEL="${MODEL:-small}"
LANG="${LANG:-zh}"

"${WHISPER_BIN}" \
  --model "${MODEL}" \
  --model_dir "${MODEL_DIR}" \
  --device cpu \
  --fp16 False \
  --language "${LANG}" \
  --output_dir "${OUT_DIR}" \
  --output_format all \
  "${INPUT}"

echo "OK: ${OUT_DIR}"
