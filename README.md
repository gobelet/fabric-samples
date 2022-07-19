This is the README for the Hyperlegit Project, in Database Systems.

The goal of Hyperlegit is to create a safe and transparent queueing system for buying tickets online. Please watch our presentation or read our presentation slides for more information.

This project is a fork of fabric-samples.
You can do 2 things to test the project :
- use the files in asset-transfer-basic/application-javascript/ in a terminal
- run the scenarios.py file

The scenarios file is an interface presenting 3 different scenarios for a queue : 
- a user enters the queue, then pays
- a user enters the queue, waits, refreshes his status, then pays
- a user enters the queue, then cancels

Before running this program, please change the path name line 26 to your path for the fabric-samples directory (or alternatively, run the program directly and change the path in the first window that appears)
Afterwards, you can freely navigate through the scenarios.

To run some files in the terminal :
- First go to test-network directory
- Run "./network.sh up createChannel -c mychannel -ca"
- Run "./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript"
- Go to asset-transfer-basic/application-javascript/
- Run the files you want using node
- The first file that should be run is init.js

Instructions to run a file (if the variable is in [ ], it means it is optional):
- init.js [nb_tickets] -> creates the first queue
- createQueue.js queueId [nb_tickets] -> to create a new queue
- readQueue.js queueId -> returns the information related to the queue with ID queueID
- readAll.js -> returns all queues
- readStatus.js clientId [queueId] -> returns the rank and number of tickets left related to a specific clientId and queueId
- enterQueue.js clientId [queueId] -> enters a client in the queue with clientId
- leaveQueue.js clientId [queueId] -> deletes clientId from queueId
- pay.js clientId [queueId] -> registers payment for clientId in queueId

By default, the queueId will be "queue1" (the ID of the queue created by running the init.js file), and nb_tickets will be 5
