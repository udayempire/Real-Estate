// create,update,block staffs

import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { createStaffInput } from "../../validators/staff.validator";
import { hashPassword } from "../../utils/password";

export async function createStaff(req: Request, res: Response) {
    try {
        const { firstName, lastName, age, gender, phone, email, password, role } = req.body as createStaffInput;
        if (!password) {
            return res.status(400).json({ message: "Password is required" });
        }
        const passwordHash = await hashPassword(password);
        await prisma.staff.create({
            data: {
                firstName,
                lastName,
                age,
                gender,
                phone,
                email,
                role,
                password,
                passwordHash,
            },
        });
        return res.status(201).json({ message: "Staff created successfully" });
    } catch (error) {
        console.error("Create staff error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}