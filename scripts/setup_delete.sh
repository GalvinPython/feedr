#!/bin/bash

#################################################
### !Run from the root folder of the project! ###
#################################################

# To run after testing

# Stop the services
sudo systemctl stop feedr-bot.service

# Disable the services
sudo systemctl disable feedr-bot.service

# Remove the service files
sudo rm /etc/systemd/system/feedr-bot.service

# Reload the systemd daemon to apply changes
sudo systemctl daemon-reload
