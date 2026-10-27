param(
  [Parameter(Mandatory = $true)][string]$Installer,
  [Parameter(Mandatory = $true)][string]$InstalledDirectory,
  [string]$OutputDirectory = 'dist-windows/icon-checks'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$source = [System.Drawing.Icon]::new((Join-Path $PSScriptRoot 'build/icon.ico'), 32, 32)
$expected = $source.ToBitmap()
try {
  $targets = @{
    installer = $Installer
    application = Join-Path $InstalledDirectory 'ArzDesk.exe'
    uninstaller = Join-Path $InstalledDirectory 'Uninstall ArzDesk.exe'
  }
  foreach ($entry in $targets.GetEnumerator()) {
    $extracted = [System.Drawing.Icon]::ExtractAssociatedIcon($entry.Value)
    if ($null -eq $extracted) { throw "Missing $($entry.Key) icon" }
    $sized = [System.Drawing.Icon]::new($extracted, 32, 32)
    $actual = $sized.ToBitmap()
    try {
      $actual.Save((Join-Path (Resolve-Path $OutputDirectory) "$($entry.Key).png"))
      $difference = 0L
      $samples = 0
      for ($y = 0; $y -lt 32; $y++) {
        for ($x = 0; $x -lt 32; $x++) {
          $want = $expected.GetPixel($x, $y)
          if ($want.A -lt 240) { continue }
          $got = $actual.GetPixel($x, $y)
          $difference += [Math]::Abs([int]$want.R - [int]$got.R)
          $difference += [Math]::Abs([int]$want.G - [int]$got.G)
          $difference += [Math]::Abs([int]$want.B - [int]$got.B)
          $samples += 3
        }
      }
      if ($samples -lt 100 -or ($difference / $samples) -gt 15) {
        throw "The $($entry.Key) does not contain the ArzDesk icon"
      }
      Write-Host "ARZDESK_ICON_OK $($entry.Key)"
    } finally {
      $actual.Dispose()
      $sized.Dispose()
      $extracted.Dispose()
    }
  }
} finally {
  $expected.Dispose()
  $source.Dispose()
}
