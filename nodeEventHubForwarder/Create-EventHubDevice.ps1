###  Define the devices that will be created
# Security context is not necessary.  only the UUID is needed to set security

<# the RedmondLabs user
$meAuthHeader = @{ meshblu_auth_uuid = '7cbaef50-d7ac-11e4-976d-bd7fd1758f7c'; meshblu_auth_token = '057c6babf08df76677faa1bd7ee13e9acdf8a890' }

# the brian.ehlert@citrix integrated G2M auth account
$meAuthHeader = @{ meshblu_auth_uuid = '6c4d613d-b986-41e7-8d3d-41a8d45abe6a'; meshblu_auth_token = 'b28266a16b860a10d80fe789d01399ef0e869b85' }

# the brian.ehlert@citrix.com account
$meAuthHeader = @{ meshblu_auth_uuid = '0ae45d40-4f25-11e4-bcdc-518050fe90b4'; meshblu_auth_token = '31db4c0c509a470f2ba099e2a8dcb33cdc1a4934' }
#>


# define permissions
$user = @()
$user += @{ uuid = $meAuthHeader.meshblu_auth_uuid }

$anyone = @()
$anyone += @{ uuid = '*' }

$empty = @()

$configureWhitelist = @{
    as = $empty;
    received = $empty;
    sent = $empty;
    update = $user
}

$message = @{
    as = $empty;
    received = $empty;
    sent = $anyone
}

$discover = @{
    as = $empty;
    view = $user
}

$broadcast = @{
    as = $empty;
    received = $anyone;
    sent = $anyone
}

$whitelists = @{
    configure = $configureWhitelist;
    message = $message;
    discover = $discover;
    broadcast = $broadcast
}

$meshblu = @{
    version = "2.0.0";
    whitelists = $whitelists;
}


## build the device

# Event Hub Forwarder Device
$body = @{
    online = $true;
    owner = $meAuthHeader.meshblu_auth_uuid;
    type = "device:msfteventhub";
    logo = "https://azurecomcdn.azureedge.net/cvt-032cae4daf6b97d2790fc67abda30d01fac0dc73e4d78f898146e5fa83074794/images/page/services/event-hubs/stream.png";
    name = "Azure Event Hub Forwarder"; 
    meshblu = $meshblu
}


### Create the device
$json_body = $body | ConvertTo-Json -Depth 99

### create the device
#$device = Invoke-RestMethod -URI http://meshblu-http.hpe.octoblu.com/devices -ContentType "application/json" -body $json_body -Method Post
$device = Invoke-RestMethod -URI http://meshblu-http.octoblu.com/devices -ContentType "application/json" -body $json_body -Method Post

###  Save the devices to a file
$device | ConvertTo-Json -Depth 99 | Out-File -FilePath .\EventHubForwarder.json

