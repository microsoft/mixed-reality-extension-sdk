param([String]$app)

Get-ChildItem . | Where-Object { $_.Name -NotMatch "node_modules|src|$app\.zip$|tsconfig\.json$|\.d\.ts$|\.js\.map$" } | Compress-Archive -Force -DestinationPath "$app.zip"
#Get-ChildItem . | Where-Object { $_.Name -NotMatch "node_modules|src|$app\.zip$|tsconfig\.json$|\.d\.ts$|\.js\.map$" } | Write-Output
