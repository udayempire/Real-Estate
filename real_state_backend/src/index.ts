import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// app.use(`${process.env.API_VERSION}/admin`);
// app.use(`${process.env.API_VERSION}/broker`);
// app.use(`${process.env.API_VERSION}/user`);

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