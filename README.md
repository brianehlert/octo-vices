# octo-vices
Purpose build devices for Octoblu / Meshblu.

# Echo
This is a device desigend to test messaging through the system.
You send a message to the Echo device withteh UUID of another device and a wait time.
The wait time is honored and the message is forwarded.
Threads are used so that the wait will not prevent messages from flowing.

# nodeEventHubForwarder
Any messages sent to this device will be encrypted and forwarded to an Azure Service Bus Event Hub for injestion.

