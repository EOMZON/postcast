#!/usr/bin/env bash
set -euo pipefail

# Local pipeline (no Git): Demucs separate -> RVC(iPhone) vocals -> mix -> AAC preview.
#
# Usage:
#   bash scripts/local_audio_iphone_mix.sh "audio/_local/source/xxx.m4a" [slug]
#
# Outputs (ignored by Git):
#   audio/_local/stems/htdemucs/<slug>/
#     - vocals.wav drums.wav bass.wav other.wav
#     - vocals_rvc.wav mix_rvc.wav
#   audio/_local/output/<slug>_mix_rvc.m4a

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_DIR}"

INPUT="${1:-}"
SLUG="${2:-}"

if [[ -z "${INPUT}" ]]; then
  echo "Usage: $0 <audio file> [slug]" >&2
  exit 1
fi
if [[ ! -f "${INPUT}" ]]; then
  echo "Audio file not found: ${INPUT}" >&2
  exit 1
fi

if [[ -z "${SLUG}" ]]; then
  base="$(basename "${INPUT}")"
  SLUG="${base%.*}"
fi

DEMUCS_BIN="${DEMUCS_BIN:-../../../10_music/Minimax轻音乐与分轨研究/spleeter-py310/bin/demucs}"
RVC_MIX_SCRIPT="${RVC_MIX_SCRIPT:-../../../10_music/convert_and_mix.sh}"
RVC_MODEL="${RVC_MODEL:-iphone.pth}"

STEMS_OUT="audio/_local/stems"
OUT_DIR="audio/_local/output"

mkdir -p "${STEMS_OUT}" "${OUT_DIR}"

export OMP_NUM_THREADS="${CPU_THREADS:-2}"
export MKL_NUM_THREADS="${CPU_THREADS:-2}"
export NUMEXPR_NUM_THREADS="${CPU_THREADS:-2}"
export OPENBLAS_NUM_THREADS="${CPU_THREADS:-2}"
export VECLIB_MAXIMUM_THREADS="${CPU_THREADS:-2}"

echo "=== Demucs separate ==="
echo "input: ${INPUT}"
echo "slug:  ${SLUG}"
"${DEMUCS_BIN}" -o "${STEMS_OUT}" --filename "${SLUG}/{stem}.{ext}" "${INPUT}"

SONG_DIR="${STEMS_OUT}/htdemucs/${SLUG}"
if [[ ! -d "${SONG_DIR}" ]]; then
  echo "Demucs output missing: ${SONG_DIR}" >&2
  exit 1
fi

echo
echo "=== RVC iPhone vocals + mix ==="
"${RVC_MIX_SCRIPT}" "${SONG_DIR}" "${RVC_MODEL}"

MIX_WAV="${SONG_DIR}/mix_rvc.wav"
if [[ ! -f "${MIX_WAV}" ]]; then
  echo "mix_rvc.wav not found (did demucs output 4 stems?): ${MIX_WAV}" >&2
  exit 1
fi

OUT_M4A="${OUT_DIR}/${SLUG}_mix_rvc.m4a"
echo
echo "=== Encode preview ==="
ffmpeg -y -hide_banner -loglevel error -i "${MIX_WAV}" -c:a aac -b:a 192k "${OUT_M4A}"
echo "OK: ${OUT_M4A}"
