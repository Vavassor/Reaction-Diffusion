const express = require("express");
const path = require("path");

const app = express();
const router = express.Router();

app.use(express.static(path.join(__dirname, "app/dist")));

router.get("/", (request, response) => {
  response.sendFile(path.join(__dirname, "app/dist/index.html"));
});

app.use("/", router);

app.listen(process.env.PORT || 8080);