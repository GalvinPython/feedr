#!/bin/bash

#################################################
### !Run from the root folder of the project! ###
#################################################

# To run after testing

# Stop the services
sudo systemctl stop feedr-bot.service
sudo systemctl stop feedr-web.service
sudo systemctl stop feedr-api.service

# Disable the services
sudo systemctl disable feedr-bot.service
sudo systemctl disable feedr-web.service
sudo systemctl disable feedr-api.service

# Remove the service files
sudo rm /etc/systemd/system/feedr-bot.service
sudo rm /etc/systemd/system/feedr-web.service
sudo rm /etc/systemd/system/feedr-api.service

# Reload the systemd daemon to apply changes
sudo systemctl daemon-reload
