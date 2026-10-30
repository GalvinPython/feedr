#!/bin/bash

#################################################
### !Run from the root folder of the project! ###
#################################################

# Update the repo
git pull origin main

# Install dependencies
bun install

# Apply schema changes before restarting the bot
bun run db:push:prod || exit 1

# Retire legacy services
sudo systemctl stop feedr-web.service || true
sudo systemctl stop feedr-api.service || true
sudo systemctl disable feedr-web.service || true
sudo systemctl disable feedr-api.service || true

# Restart the services
sudo systemctl restart feedr-bot
