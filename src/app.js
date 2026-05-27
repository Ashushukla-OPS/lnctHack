const express = require("express");
let cookieParser = require("cookie-parser");
const authRoutes = require("../routes/auth.routes");
const authMiddleware = require("../middleware/auth.middleware");
const ApiResponse = require("../utils/apiResponse");
const errorMiddleware = require("../middleware/error.middleware");
const userRoutes = require("../routes/user.routes");
const teamRoutes = require("../routes/team.routes");
const requestRoutes = require("../routes/request.routes");
const scoreRoutes = require("../routes/score.routes")
const messageRoutes = require("../routes/message.routes")
const  hackathonRoutes = require("../routes/hackathon.routes")

const app = express()
app.use(cookieParser());


app.use(express.json())

app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes);

app.use("/api/teams", teamRoutes);

app.use("/api/requests", requestRoutes);

app.use("/api/score", scoreRoutes);

app.use("/api/message", messageRoutes)

app.use("/api/hackathon", hackathonRoutes)

app.get("/home", authMiddleware, (req,res)=>{
    return res.status(200).json(new ApiResponse("home fetched successfully"))
})

app.use(errorMiddleware)

module.exports = app