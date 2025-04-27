async function fetchBotInfo() {
    const response = await fetch("/botinfo");

    if (!response.ok) {
        throw new Error("Failed to fetch bot info");
    }

    return response.json();
}

fetchBotInfo();
