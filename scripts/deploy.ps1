# Azure Deploy
# Deploys a project to an Azure Web Service

# Prerequisite actions. Perform these commands in the shell:
#  az login
#  az account set --subscription <subscriptionId>

# Usage:
#  .\deploy.ps1 -group "<group-name>" -name "<service-name>" -path "<path-to-project>"

param(
    [parameter(ValueFromPipeline)]
    [String]$group,
    [parameter(ValueFromPipeline)]
    [String]$name,
    [parameter(ValueFromPipeline)]
    [System.IO.FileInfo]$path
)

az webapp deployment source config-zip --resource-group "$group" --name "$name" --src "$path/app.zip"
