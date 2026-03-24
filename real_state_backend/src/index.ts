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
import supportRoutes from "./routes/support/support.route"
import savedPropertyRoutes from "./routes/savedProperty/savedProperty.route"
import savedExclusivePropertyRoutes from "./routes/savedExclusiveProperty/savedExclusiveProperty.route"
import metadataRoutes from "./routes/metadata/metadata.route"
import appointmentRoutes from "./routes/appointment/appointment.route"
import staffRoutes from "./routes/staff/staff.routes"
import analyticsRoutes from "./routes/analytics/analytics.route"
import cors from "cors";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(process.cwd(), '.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

const app = express();
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json())
const PORT = process.env.PORT || 5000;
const server = createServer(app);

// ─── Swagger Docs ────────────────────────────────────────
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
app.use(`${process.env.API_VERSION}/support`,supportRoutes);
app.use(`${process.env.API_VERSION}/saved-properties`,savedPropertyRoutes);
app.use(`${process.env.API_VERSION}/saved-exclusive-properties`,savedExclusivePropertyRoutes);
app.use(`${process.env.API_VERSION}/metadata`,metadataRoutes);
app.use(`${process.env.API_VERSION}/appointments`,appointmentRoutes);
app.use(`${process.env.API_VERSION}/staff`,staffRoutes);
app.use(`${process.env.API_VERSION}`,analyticsRoutes);

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