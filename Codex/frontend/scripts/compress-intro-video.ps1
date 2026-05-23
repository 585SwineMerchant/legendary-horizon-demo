# Re-encode intro MP4 for web delivery (smaller than DaVinci export, easier to host on GitHub Release).
# Requires ffmpeg on PATH: https://ffmpeg.org/download.html

$ErrorActionPreference = 'Stop'
$introDir = Join-Path $PSScriptRoot '..\public\assets\intro'
$src = Join-Path $introDir 'intro_davinci.mp4'
$dst = Join-Path $introDir 'intro_davinci.web.mp4'

if (-not (Test-Path $src)) {
  Write-Error "Missing source: $src"
}

Write-Host "Encoding web preview -> $dst"
ffmpeg -y -i $src `
  -vf "scale='min(1920,iw)':-2" `
  -c:v libx264 -preset slow -crf 23 `
  -c:a aac -b:a 128k `
  -movflags +faststart `
  $dst

$before = (Get-Item $src).Length / 1MB
$after = (Get-Item $dst).Length / 1MB
Write-Host ("Done. {0:N1} MB -> {1:N1} MB" -f $before, $after)
Write-Host "Upload intro_davinci.web.mp4 to GitHub Release intro-media-v1 and set:"
Write-Host "  VITE_LH_INTRO_VIDEO_URL=https://github.com/585swinemerchant/legendary-horizon-demo/releases/download/intro-media-v1/intro_davinci.web.mp4"
