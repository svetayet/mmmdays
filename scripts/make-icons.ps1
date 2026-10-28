# MmmDays: генератор иконок — «календарик из круглых точечек» (промо-палитра).
# Запуск: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/make-icons.ps1 [-Verify]
param([switch]$Verify)

Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$outDir = Join-Path $root 'public/icons'
New-Item -ItemType Directory -Force $outDir | Out-Null

$Bg     = [System.Drawing.Color]::FromArgb(130, 122, 130)  # #827A82 card
$Deep   = [System.Drawing.Color]::FromArgb(103,  95, 104)  # #675F68 deep
$Accent = [System.Drawing.Color]::FromArgb(232, 154, 164)  # #E89AA4 accent
$Light  = [System.Drawing.Color]::FromArgb(244, 198, 204)  # #F4C6CC light

$HeavyDays = @(11, 12, 13, 14, 15)
$LightDay  = 17
$TodayDay  = 24

function New-Canvas([int]$size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)
  [pscustomobject]@{ Bmp = $bmp; G = $g; Size = $size }
}

function Save-Canvas($c, [string]$name) {
  $path = Join-Path $outDir $name
  $c.G.Dispose()
  $c.Bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $c.Bmp.Dispose()
  Write-Host "  $name"
}

function Get-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = 2.0 * $r
  $p.AddArc($x,       $y,       $d, $d, 180, 90)
  $p.AddArc($x + $w - $d, $y,       $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d,   0, 90)
  $p.AddArc($x,       $y + $h - $d, $d, $d,  90, 90)
  $p.CloseFigure()
  $p
}

function Draw-DotCalendar($c, [bool]$fullBleed) {
  $g = $c.G; $s = [float]$c.Size
  $bgBrush = New-Object System.Drawing.SolidBrush($Bg)
  if ($fullBleed) {
    $g.FillRectangle($bgBrush, 0.0, 0.0, $s, $s)
  } else {
    $path = Get-RoundedRectPath 0.0 0.0 $s $s (0.225 * $s)
    $g.FillPath($bgBrush, $path)
    $path.Dispose()
  }
  # fullBleed (maskable/apple): сетка целиком в безопасной зоне — диагональ ≤ 80% стороны
  $gridW = if ($fullBleed) { 0.60 * $s } else { 0.70 * $s }
  $cell  = $gridW / 7.0
  $gridH = 5.0 * $cell
  $dot   = 0.45 * $cell
  $x0 = ($s - $gridW) / 2.0
  $y0 = ($s - $gridH) / 2.0
  $deepB   = New-Object System.Drawing.SolidBrush($Deep)
  $accentB = New-Object System.Drawing.SolidBrush($Accent)
  $lightB  = New-Object System.Drawing.SolidBrush($Light)
  for ($i = 0; $i -lt 35; $i++) {
    $day = $i + 1
    $cx = $x0 + ($i % 7) * $cell + $cell / 2.0
    $cy = $y0 + [Math]::Floor($i / 7) * $cell + $cell / 2.0
    if ($day -eq $TodayDay) {
      $g.FillEllipse($deepB, [float]($cx - $dot / 2), [float]($cy - $dot / 2), [float]$dot, [float]$dot)
      $ringD = $dot * 1.5
      $pen = New-Object System.Drawing.Pen($Accent, [float]($dot * 0.28))
      $g.DrawEllipse($pen, [float]($cx - $ringD / 2), [float]($cy - $ringD / 2), [float]$ringD, [float]$ringD)
      $pen.Dispose()
    } elseif ($HeavyDays -contains $day) {
      $g.FillEllipse($accentB, [float]($cx - $dot / 2), [float]($cy - $dot / 2), [float]$dot, [float]$dot)
    } elseif ($day -eq $LightDay) {
      $d2 = 0.72 * $dot
      $g.FillEllipse($lightB, [float]($cx - $d2 / 2), [float]($cy - $d2 / 2), [float]$d2, [float]$d2)
    } else {
      $g.FillEllipse($deepB, [float]($cx - $dot / 2), [float]($cy - $dot / 2), [float]$dot, [float]$dot)
    }
  }
  $deepB.Dispose(); $accentB.Dispose(); $lightB.Dispose(); $bgBrush.Dispose()
}

# «Кружок в кружочке» — фирменный знак промо-героя (favicon).
function Draw-Mark($c) {
  $g = $c.G; $s = [float]$c.Size
  $accentB = New-Object System.Drawing.SolidBrush($Accent)
  $path = Get-RoundedRectPath 0.0 0.0 $s $s (0.25 * $s)
  $g.FillPath($accentB, $path)
  $path.Dispose()
  $lightB = New-Object System.Drawing.SolidBrush($Light)
  $d = 0.38 * $s
  $cx = 0.69 * $s; $cy = 0.72 * $s  # как .icon::after на промо
  $g.FillEllipse($lightB, [float]($cx - $d / 2), [float]($cy - $d / 2), [float]$d, [float]$d)
  $accentB.Dispose(); $lightB.Dispose()
}

Write-Host 'MmmDays icons:'
$c = New-Canvas 512; Draw-DotCalendar $c $false; Save-Canvas $c 'icon-512.png'
$c = New-Canvas 192; Draw-DotCalendar $c $false; Save-Canvas $c 'icon-192.png'
$c = New-Canvas 512; Draw-DotCalendar $c $true;  Save-Canvas $c 'maskable-512.png'
$c = New-Canvas 180; Draw-DotCalendar $c $true;  Save-Canvas $c 'apple-touch-icon.png'
$c = New-Canvas 32;  Draw-Mark $c;               Save-Canvas $c 'favicon-32.png'

if ($Verify) {
  # выборочная проверка цветов: сетка 512-й иконки, геометрия та же, что при отрисовке
  $bmp = New-Object System.Drawing.Bitmap((Join-Path $outDir 'icon-512.png'))
  function Sample([string]$label, [int]$x, [int]$y) {
    $p = $bmp.GetPixel($x, $y)
    '{0,-13} ({1,3},{2,3}) -> #{3:X2}{4:X2}{5:X2} a={6}' -f $label, $x, $y, $p.R, $p.G, $p.B, $p.A
  }
  $gridW = 0.70 * 512; $cell = $gridW / 7.0; $x0 = (512 - $gridW) / 2.0; $y0 = (512 - 5.0 * $cell) / 2.0
  Sample 'bg'          256  10
  Sample 'corner'        4   4
  Sample 'deep(day1)'  ([int]($x0 + $cell / 2))         ([int]($y0 + $cell / 2))
  Sample 'heavy(day13)' ([int]($x0 + 5 * $cell + $cell / 2)) ([int]($y0 + $cell + $cell / 2))
  Sample 'light(day17)' ([int]($x0 + 2 * $cell + $cell / 2)) ([int]($y0 + 2 * $cell + $cell / 2))
  Sample 'today-ring'  ([int]($x0 + 2 * $cell + $cell / 2)) ([int]($y0 + 3 * $cell + $cell / 2))
  $bmp.Dispose()
}
