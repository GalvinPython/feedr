import path from "path";

import express from "express";
import cors from "cors";

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/botinfo", (req, res) => {
    res.status(500).json("Not implemented yet");
});

app.listen(port, () => {
    console.log(`Feedr app listening on port http://localhost:${port}`);
});
