# Prepare Oracle cutscene assets for DaVinci Resolve (v2 naming + MP3 audio).
# Run from repo root:
#   .\Codex\frontend\scripts\prepare-oracle-cutscene-assets.ps1

$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$oracleRoot = Join-Path $root 'Codex\frontend\public\assets\intro\Oracle Cut Scene'
$individuals = Join-Path $oracleRoot 'oracle_cutscene_individuals'
$outDir = Join-Path $oracleRoot 'resolve-ready'
$audioIn = Join-Path $oracleRoot 'legendary_horizon_oracle_audio_pack'
$scrollHtml = Join-Path $oracleRoot 'oracle-scroll-closeup-reference.html'

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $outDir 'audio') | Out-Null

# --- Still images (v2 filenames) ---
$imageMap = @{
  '01_oracle_chamber_wide.png'       = 'oracle_chamber_wide.png'
  '04_oracle_statue_awaken.png'      = 'oracle_statue_glow.png'
  '05_vision_threads.png'            = 'oracle_vision_threads.png'
  '06_vision_glimpse.png'            = 'oracle_vision_glimpse.png'
  '07_convergence_tome.png'          = 'oracle_convergence_tome.png'
}

foreach ($pair in $imageMap.GetEnumerator()) {
  $src = Join-Path $individuals $pair.Key
  if (-not (Test-Path $src)) {
    Write-Warning "Missing source image: $src"
    continue
  }
  Copy-Item -Force $src (Join-Path $outDir $pair.Value)
  Write-Host "Copied $($pair.Key) -> $($pair.Value)"
}

# Scroll close-up: prefer freshly rendered canon rune still if present
$scrollRendered = Join-Path $outDir 'oracle_scroll_closeup.png'
$scrollFromHtml = Join-Path $oracleRoot '_rendered_oracle_scroll_closeup.png'

$edgePaths = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
)
$browser = $edgePaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($browser -and (Test-Path $scrollHtml)) {
  $uri = [Uri]::new((Resolve-Path $scrollHtml).Path).AbsoluteUri
  Write-Host "Rendering scroll reference via headless browser..."
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & $browser --headless=new --disable-gpu --hide-scrollbars `
    --window-size=1920,1080 "--screenshot=$scrollFromHtml" $uri 2>&1 | Out-Null
  $ErrorActionPreference = $prevEap
  if (Test-Path $scrollFromHtml) {
    Copy-Item -Force $scrollFromHtml $scrollRendered
    Write-Host "Rendered canon scroll -> oracle_scroll_closeup.png"
  }
}

if (-not (Test-Path $scrollRendered)) {
  $legacy = Join-Path $individuals '02_scroll_closeup.png'
  if (Test-Path $legacy) {
    Copy-Item -Force $legacy $scrollRendered
    Write-Warning "Using legacy 02_scroll_closeup.png (Elder Futhark). Re-run after fixing headless screenshot for canon guild runes."
  }
}

# --- Audio WAV -> MP3 for Resolve ---
$ffmpegCmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
$ffmpeg = if ($ffmpegCmd) { $ffmpegCmd.Source } else { $null }
if (-not $ffmpeg) {
  Write-Warning 'ffmpeg not found — skip MP3 conversion; use WAV files from legendary_horizon_oracle_audio_pack'
} else {
  $audioMap = @{
    'oracle_ambient_base_loop_30s.wav' = 'oracle_ambient_base.mp3'
    'oracle_music_sting_42s.wav'       = 'oracle_music_sting.mp3'
    'oracle_rune_chime_single.wav'     = 'oracle_rune_chime.mp3'
    'oracle_tremor_single.wav'         = 'oracle_tremor.mp3'
  }
  foreach ($pair in $audioMap.GetEnumerator()) {
    $src = Join-Path $audioIn $pair.Key
    $dst = Join-Path (Join-Path $outDir 'audio') $pair.Value
    if (-not (Test-Path $src)) {
      Write-Warning "Missing audio: $src"
      continue
    }
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    & $ffmpeg -y -i $src -codec:a libmp3lame -qscale:a 2 $dst 2>&1 | Out-Null
    $ErrorActionPreference = $prevEap
    Write-Host "Encoded $($pair.Value)"
  }
}

Write-Host ""
Write-Host "Resolve-ready folder: $outDir"
Write-Host "Import images + audio/audio/*.mp3 into DaVinci timeline per Project Documents/oracle_cutscene_production_v2.md"
