Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path (Split-Path -Parent $root) "public\logo.png"
if (-not (Test-Path $sourcePath)) {
    Write-Error "Cannot find $sourcePath"
    exit 1
}

$sourceImg = [System.Drawing.Image]::FromFile($sourcePath)

function Resize-Image($img, $targetWidth, $targetHeight, $destPath) {
    $destBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($destBmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($img, 0, 0, $targetWidth, $targetHeight)
    $graphics.Dispose()
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
}

function Create-Foreground-Icon($img, $totalSize, $logoSize, $destPath) {
    $destBmp = New-Object System.Drawing.Bitmap($totalSize, $totalSize)
    $graphics = [System.Drawing.Graphics]::FromImage($destBmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $offset = [int](($totalSize - $logoSize) / 2)
    $graphics.DrawImage($img, $offset, $offset, $logoSize, $logoSize)
    $graphics.Dispose()
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
}

$resBase = Join-Path $PSScriptRoot "android\app\src\main\res"

# mdpi
Resize-Image $sourceImg 48 48 (Join-Path $resBase "mipmap-mdpi\ic_launcher.png")
Resize-Image $sourceImg 48 48 (Join-Path $resBase "mipmap-mdpi\ic_launcher_round.png")
Create-Foreground-Icon $sourceImg 108 72 (Join-Path $resBase "mipmap-mdpi\ic_launcher_foreground.png")

# hdpi
Resize-Image $sourceImg 72 72 (Join-Path $resBase "mipmap-hdpi\ic_launcher.png")
Resize-Image $sourceImg 72 72 (Join-Path $resBase "mipmap-hdpi\ic_launcher_round.png")
Create-Foreground-Icon $sourceImg 162 108 (Join-Path $resBase "mipmap-hdpi\ic_launcher_foreground.png")

# xhdpi
Resize-Image $sourceImg 96 96 (Join-Path $resBase "mipmap-xhdpi\ic_launcher.png")
Resize-Image $sourceImg 96 96 (Join-Path $resBase "mipmap-xhdpi\ic_launcher_round.png")
Create-Foreground-Icon $sourceImg 216 144 (Join-Path $resBase "mipmap-xhdpi\ic_launcher_foreground.png")

# xxhdpi
Resize-Image $sourceImg 144 144 (Join-Path $resBase "mipmap-xxhdpi\ic_launcher.png")
Resize-Image $sourceImg 144 144 (Join-Path $resBase "mipmap-xxhdpi\ic_launcher_round.png")
Create-Foreground-Icon $sourceImg 324 216 (Join-Path $resBase "mipmap-xxhdpi\ic_launcher_foreground.png")

# xxxhdpi
Resize-Image $sourceImg 192 192 (Join-Path $resBase "mipmap-xxxhdpi\ic_launcher.png")
Resize-Image $sourceImg 192 192 (Join-Path $resBase "mipmap-xxxhdpi\ic_launcher_round.png")
Create-Foreground-Icon $sourceImg 432 288 (Join-Path $resBase "mipmap-xxxhdpi\ic_launcher_foreground.png")

# Splash screen logo update
function Create-Splash($img, $width, $height, $logoDimension, $destPath) {
    $destBmp = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($destBmp)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 15, 23, 42)) # Deep navy background matching app theme
    $offsetX = [int](($width - $logoDimension) / 2)
    $offsetY = [int](($height - $logoDimension) / 2)
    $graphics.DrawImage($img, $offsetX, $offsetY, $logoDimension, $logoDimension)
    $graphics.Dispose()
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
}

Create-Splash $sourceImg 480 800 200 (Join-Path $resBase "drawable\splash.png")
Create-Splash $sourceImg 480 800 200 (Join-Path $resBase "drawable-port-hdpi\splash.png")
Create-Splash $sourceImg 320 480 150 (Join-Path $resBase "drawable-port-mdpi\splash.png")
Create-Splash $sourceImg 720 1280 280 (Join-Path $resBase "drawable-port-xhdpi\splash.png")
Create-Splash $sourceImg 960 1600 360 (Join-Path $resBase "drawable-port-xxhdpi\splash.png")
Create-Splash $sourceImg 1280 1920 450 (Join-Path $resBase "drawable-port-xxxhdpi\splash.png")

$sourceImg.Dispose()
Write-Host "All Android icons and splash screens successfully generated from public\logo.png"
