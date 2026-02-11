import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import swaggerUi from "swagger-ui-express";
import { parse } from "yaml";
import userRoutes from "./routes/user/index";
import propertyRoutes from "./routes/property/property.route"
import uploadRoutes from "./routes/upload/upload.route"
dotenv.config();

const app = express();
app.use(express.json())
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// ─── Swagger Docs ────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const swaggerYaml = readFileSync(join(__dirname, "../docs/openapi.yaml"), "utf8");

const swaggerDocument = parse(swaggerYaml);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "Real State API Docs",
    customCss: '.swagger-ui .topbar { display: none }',
}));

// app.use(`${process.env.API_VERSION}/admin`);
// app.use(`${process.env.API_VERSION}/broker`);
app.use(`${process.env.API_VERSION}/user`,userRoutes);
app.use(`${process.env.API_VERSION}/property`,propertyRoutes);
app.use(`${process.env.API_VERSION}/upload`,uploadRoutes);

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