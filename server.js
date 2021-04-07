const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", require("./routes/indexRoute"));

// port listening
const port = process.env.PORT || 5555;
app.listen(port, () => {
    console.log(`Server Started at http://localhost:${port}`);
});