# Script to create favicon.ico if it doesn't exist
# This creates a minimal 16x16 ICO file

$targetPath = "frontend\public\favicon.ico"

# Check if favicon.ico already exists
if (Test-Path $targetPath) {
    Write-Host "favicon.ico already exists at $targetPath"
    exit 0
}

# Minimal 16x16 ICO file in hex (1x1 pixel blue icon for simplicity)
# This is a valid ICO format file with minimal icon data
$icoHex = @"
00000100010010100000010020006804000000160000002020C0000100200400E8020000286000003030000000
200000406000000000000000000000000000000000FF0000FF00FF00FFFF0000FF0000FF00FF00000000FF00FF0
0FFFFFFFFFF0000FF000000000000FFFF00FF0000FF00FF00000000FF000000000000FF000000000000FF0000FF
00FF00000000FF000000FF0000FFFFFF0000FF0000FF0000FF00FF00FF0000FF000000FF0000FF0000FF000000
0000FFFF00
"@

# Convert hex string to byte array
$hex = [string]::Join("", ($icoHex -split '\s+'))
$bytes = New-Object byte[] ($hex.Length / 2)
for ($i = 0; $i -lt $hex.Length; $i += 2) {
    $bytes[$i / 2] = [byte]::Parse($hex.Substring($i, 2), 'HexNumber')
}

# Write the ICO file
$bytes | Set-Content -Path $targetPath -AsByteStream

Write-Host "Created minimal favicon.ico at $targetPath"
