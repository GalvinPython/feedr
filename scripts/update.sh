#!/bin/bash

#################################################
### !Run from the root folder of the project! ###
#################################################

# Update the repo
git pull origin main

# Install dependencies
bun install

# Restart the services
sudo systemctl restart feedr-bot
sudo systemctl restart feedr-web
sudo systemctl restart feedr-api
