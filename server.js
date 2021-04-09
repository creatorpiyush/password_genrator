const express = require("express");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(__dirname + "/public"));

app.set("view engine", "hbs");
app.set("views", "./public/views");

app.use("/", require("./routes/indexRoute"));
app.use("/user", require("./routes/userRoute"));

// port listening
const port = process.env.PORT || 5555;
app.listen(port, () => {
    console.log(`Server Started at http://localhost:${port}`);
});