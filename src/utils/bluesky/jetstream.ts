// WIP

import WebSocket from "ws";

const url = "wss://jetstream2.us-east.bsky.network/subscribe";
let ws: WebSocket;

function connect() {
    ws = new WebSocket(url);

    ws.on("open", () => {
        console.log("Connected to WebSocket");
    });

    ws.on("message", (message) => {
        const text = message.toString();

        if (!text.includes(`"record":{"$type":"app.bsky.feed.post"`)) return;
        console.log("Received message:", message.toString());
    });

    ws.on("close", () => {
        console.log("WebSocket connection closed. Reconnecting...");
        connect();
    });

    ws.on("error", (error) => {
        console.error("WebSocket error:", error);
    });
}

connect();
