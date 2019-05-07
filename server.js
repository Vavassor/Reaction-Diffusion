const express = require("express");
const path = require("path");

const app = express();
const router = express.Router();

app.use("/dist", express.static(path.join(__dirname, "app/dist")));
app.use("/assets", express.static(path.join(__dirname, "app/assets")));

router.get("/", (request, response) => {
  response.sendFile(path.join(__dirname, "index.html"));
});

app.use("/", router);

app.listen(process.env.PORT || 8080);