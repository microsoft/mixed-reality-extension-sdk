# Azure Deploy
# Compresses a project in prep for deployment to Azure

# Usage:
#  .\compress.ps1 -path "path-to-project"

# Example:
#   .\compress.ps1 -path "../samples/hello-world"

param(
    [parameter(ValueFromPipeline)]
    [System.IO.FileInfo]$path
)

Get-ChildItem "$path" | Where-Object { $_.Name -NotMatch "node_modules|src|$app\.zip$|tsconfig|tslint|\.md$|\.d\.ts$|\.js\.map$" } | Compress-Archive -Force -DestinationPath "$path/app.zip"
#Get-ChildItem "$path" | Where-Object { $_.Name -NotMatch "node_modules|src|$app\.zip$|tsconfig|tslint|\.md$|\.d\.ts$|\.js\.map$" } | Write-Output
