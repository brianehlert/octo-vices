###  Define the devices that will be created
# Security context is not necessary.  only the UUID is needed to set security

<# the RedmondLabs user
$meAuthHeader = @{ meshblu_auth_uuid = '7cbaef50-d7ac-11e4-976d-bd7fd1758f7c'; meshblu_auth_token = '057c6babf08df76677faa1bd7ee13e9acdf8a890' }

# the brian.ehlert@citrix integrated G2M auth account
$meAuthHeader = @{ meshblu_auth_uuid = '6c4d613d-b986-41e7-8d3d-41a8d45abe6a'; meshblu_auth_token = 'b28266a16b860a10d80fe789d01399ef0e869b85' }

# the brian.ehlert@citrix.com account
$meAuthHeader = @{ meshblu_auth_uuid = '0ae45d40-4f25-11e4-bcdc-518050fe90b4'; meshblu_auth_token = '31db4c0c509a470f2ba099e2a8dcb33cdc1a4934' }
#>


## create an array to hold the device definitions
$deviceDefinition = @()
## create a json devices array to hold the faux devices
$Devices = @'
{ "nodes" : [] }
'@ | ConvertFrom-Json

## define a security array of 'anyone'
$anyone = @()
$anyone += '*'

## build the devices

# Event Hub Forwarder Device
$deviceDefinition += @{
    "owner" = $meAuthHeader.meshblu_auth_uuid
    "configureWhitelist" = $meAuthHeader.meshblu_auth_uuid
    "discoverWhitelist" = $meAuthHeader.meshblu_auth_uuid
    "receiveWhitelist" = $anyone
    "sendWhitelist" = $anyone
    type = "device:msfteventhub";
    name = "Azure Event Hub Forwarder"; 
    online = "true";
    logo = "http://acom.azurecomcdn.net/80C57D/cdn/images/cvt-032cae4daf6b97d2790fc67abda30d01fac0dc73e4d78f898146e5fa83074794/page/services/event-hubs/stream.png";
    locale = ""
}

### Create the devices
foreach ($body in $deviceDefinition) {
    # convert to json
    $json_body = $body | ConvertTo-Json

    # create the device
    $Devices.nodes += Invoke-RestMethod -URI http://meshblu.octoblu.com/devices -ContentType "application/json" -body $json_body -Method Post
}

###  Save the devices to a file
ConvertTo-Json $Devices -Depth 999 | Out-File -FilePath .\EventHubForwarders.json
