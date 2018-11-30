param([String]$group, [String]$name, [String]$app)

# Prerequisite actions. Perform these commands in the shell:
# az login
# az account set --subscription <subscriptionId>

az webapp deployment source config-zip --resource-group $group --name $name --src "$app.zip"
