const express = require("express")
const mongoose = require('mongoose')
const cors = require('cors')
const userRoutes = require("./routes/userRoutes")
const adminRouter = require("./routes/adminRouter")

const app = express()


app.use(cors())
app.use(express.json())

app.use("/users", userRoutes)
app.use("/admin", adminRouter); 

const PORT = process.env.PORT || 5000;
const MONGOOSE_URL = "mongodb://localhost:27017/test"

mongoose.connect(MONGOOSE_URL, {useNewUrlParser: true})
.then(()=> app.listen(PORT, ()=>{
    console.log(`Server is running at port ${PORT}`);
}))
.catch(err=>{
    console.log(err)
}); 