#!/bin/bash

#################################################
### !Run from the root folder of the project! ###
#################################################

# Ensure Bun is installed and available in the environment
BUN_PATH="$(which bun)"
if [[ -z "$BUN_PATH" ]]; then
  echo "❌ Bun not found in PATH. Please install it first."
  exit 1
fi

# Ensure Cargo is installed and available in the environment
CARGO_PATH="$(which cargo)"
if [[ -z "$CARGO_PATH" ]]; then
  echo "❌ Cargo not found in PATH. Please install it first."
  exit 1
fi

##############################
### Set up the bot service ###
##############################
SERVICE_NAME_BOT="feedr-bot"
SERVICE_PATH_BOT="/etc/systemd/system/${SERVICE_NAME_BOT}.service"
WORKDIR="$(pwd)"

# Create the service file
cat <<EOF | sudo tee "$SERVICE_PATH_BOT" > /dev/null
[Unit]
Description=Feedr Bot Service
After=network.target

[Service]
WorkingDirectory=${WORKDIR}
ExecStart=${BUN_PATH} run src/index.ts
Restart=on-failure
User=$USER
Environment=NODE_ENV=production
MemoryMax=1G

[Install]
WantedBy=multi-user.target
EOF

##############################
### Set up the web service ###
##############################
SERVICE_NAME_WEB="feedr-web"
SERVICE_PATH_WEB="/etc/systemd/system/${SERVICE_NAME_WEB}.service"
WORKDIR="$(pwd)"

# Create the service file
cat <<EOF | sudo tee "$SERVICE_PATH_WEB" > /dev/null
[Unit]
Description=Feedr Web Service
After=network.target

[Service]
WorkingDirectory=${WORKDIR}/web
ExecStart=${BUN_PATH} run start
Restart=on-failure
User=$USER
Environment=NODE_ENV=production
MemoryMax=1G

[Install]
WantedBy=multi-user.target
EOF

##############################
### Set up the API service ###
##############################
SERVICE_NAME_API="feedr-api"
SERVICE_PATH_API="/etc/systemd/system/${SERVICE_NAME_API}.service"
WORKDIR="$(pwd)"

# Create the service file
cat <<EOF | sudo tee "$SERVICE_PATH_API" > /dev/null
[Unit]
Description=Feedr API Service
After=network.target

[Service]
WorkingDirectory=${WORKDIR}/api
ExecStart=${CARGO_PATH} run --release
Restart=on-failure
User=$USER
MemoryMax=1G

[Install]
WantedBy=multi-user.target
EOF

### Reload systemd and enable/start the service
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME_BOT"
sudo systemctl start "$SERVICE_NAME_BOT"
sudo systemctl enable "$SERVICE_NAME_WEB"
sudo systemctl start "$SERVICE_NAME_WEB"
sudo systemctl enable "$SERVICE_NAME_API"
sudo systemctl start "$SERVICE_NAME_API"

echo "✅ Service '$SERVICE_NAME_BOT' installed and started from '$WORKDIR'."
echo "✅ Service '$SERVICE_NAME_WEB' installed and started from '$WORKDIR'."
echo "✅ Service '$SERVICE_NAME_API' installed and started from '$WORKDIR'."
