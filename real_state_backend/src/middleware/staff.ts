import { NextFunction, Request, Response } from "express";
export type StaffRole = "SUPER_ADMIN" | "ADMIN" | "VIEWER" | "CUSTOMER_SUPPORT";

const STAFF_ROLES: StaffRole[] = ["SUPER_ADMIN", "ADMIN", "VIEWER", "CUSTOMER_SUPPORT"];

export function requireStaffRole(...allowedRoles: StaffRole[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const role = req.user?.role as StaffRole;
        if (!role || !allowedRoles.includes(role)) {
            return res.status(403).json({ error: "Forbidden" });
        }
        if (!role) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Blocks normal app users even if they have a token
        if (!STAFF_ROLES.includes(role as StaffRole)) {
            return res.status(403).json({ error: "Staff access only" });
        }

        if (!allowedRoles.includes(role as StaffRole)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
}

export const requireSuperAdmin = requireStaffRole("SUPER_ADMIN");
export const requireAdminOrSuperAdmin = requireStaffRole("SUPER_ADMIN", "ADMIN");
export const requireViewerOrAbove = requireStaffRole("SUPER_ADMIN", "ADMIN", "VIEWER");
export const requireSupportOrAbove = requireStaffRole("SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT");