import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import userRoutes from "./routes/user/index";
import propertyRoutes from "./routes/property/property.route"
dotenv.config();

const app = express();
app.use(express.json())
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// app.use(`${process.env.API_VERSION}/admin`);
// app.use(`${process.env.API_VERSION}/broker`);
app.use(`${process.env.API_VERSION}/user`,userRoutes);
app.use(`${process.env.API_VERSION}/property`,propertyRoutes);

app.get("/health",(req,res)=>{
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})

server.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT}`)
})