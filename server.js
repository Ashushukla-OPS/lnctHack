require("dotenv").config()
const connectDB = require("./config/db")
const app = require("./src/app")

PORT=process.env.port

connectDB()
app.listen(PORT,()=>{
    console.log(`server is running on port ${3000}`)
})


