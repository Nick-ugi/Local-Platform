# Draws the white pictures inside the map's markers (shared/src/map/markerIcon.ts) from the
# Ionicons font the app already uses for its tabs, and writes them to this folder and to
# web/public/markers. Run it from anywhere after `npm install`:
#
#   powershell -ExecutionPolicy Bypass -File mobile/assets/markers/make-markers.ps1
#
# Each picture is 48 x 48 pixels, three pixels to a point (MARKER_ICON_PIXEL_RATIO): a 16 pt
# picture in the middle of a 28 pt circle of the kind's colour.

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$ionicons = Join-Path $root 'node_modules\@react-native-vector-icons\ionicons'
$glyphs = Get-Content (Join-Path $ionicons 'glyphmaps\Ionicons.json') -Raw | ConvertFrom-Json
$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile((Join-Path $ionicons 'fonts\Ionicons.ttf'))
$family = $fonts.Families[0]

# Marker picture -> Ionicons name, or names drawn side by side. The names in MARKER_ICONS, in the
# same order.
$icons = [ordered]@{
    food        = 'restaurant'
    cafe        = 'cafe'
    bar         = 'wine'
    activity    = 'trail-sign'
    shopping    = 'bag-handle'
    toilet      = @('man', 'woman')
    parking     = 'car'
    information = 'information'
    library     = 'library'
    medical     = 'medkit'
    facility    = 'location'
    event       = 'calendar'
    notice      = 'alert'
}

$size = 48
# The glyphs' em: Ionicons draw within 7/8 of it, which leaves a margin round the largest.
$em = 44
$targets = @($PSScriptRoot, (Join-Path $root 'web\public\markers'))
foreach ($dir in $targets) { New-Item -ItemType Directory -Force $dir | Out-Null }

foreach ($entry in $icons.GetEnumerator()) {
    # The glyphs as one shape, side by side, then centred on their outline rather than on the
    # font's baseline. Two glyphs share the width of one.
    $names = @($entry.Value)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $x = 0
    foreach ($name in $names) {
        $code = [int]$glyphs.$name
        if ($code -eq 0) { throw "Ionicons has no $name" }
        $glyph = New-Object System.Drawing.Drawing2D.GraphicsPath
        $glyph.AddString([string][char]$code, $family, 0, $em, (New-Object System.Drawing.PointF 0, 0), [System.Drawing.StringFormat]::GenericTypographic)
        $glyphBounds = $glyph.GetBounds()
        $shift = New-Object System.Drawing.Drawing2D.Matrix
        $shift.Translate($x - $glyphBounds.X, 0)
        $glyph.Transform($shift)
        $path.AddPath($glyph, $false)
        $x += $glyphBounds.Width + $em * 0.08
        $glyph.Dispose()
    }
    $bounds = $path.GetBounds()
    $fit = [math]::Min(1, ($em * 0.875) / [math]::Max($bounds.Width, $bounds.Height))
    if ($fit -lt 1) {
        $scale = New-Object System.Drawing.Drawing2D.Matrix
        $scale.Scale($fit, $fit)
        $path.Transform($scale)
        $bounds = $path.GetBounds()
    }
    $matrix = New-Object System.Drawing.Drawing2D.Matrix
    $matrix.Translate(($size - $bounds.Width) / 2 - $bounds.X, ($size - $bounds.Height) / 2 - $bounds.Y)
    $path.Transform($matrix)

    $bitmap = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.FillPath([System.Drawing.Brushes]::White, $path)
    foreach ($dir in $targets) {
        $bitmap.Save((Join-Path $dir "$($entry.Key).png"), [System.Drawing.Imaging.ImageFormat]::Png)
    }
    $graphics.Dispose()
    $bitmap.Dispose()
    $path.Dispose()
    Write-Output "$($entry.Key) <- $($names -join ' + ')"
}
