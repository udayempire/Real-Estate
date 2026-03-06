// create,update,block staffs

import { prisma } from "../../config/prisma";
import { Request, Response } from "express";
import { createStaffInput, updateStaffInput } from "../../validators/staff.validator";
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
                passwordHash
            },
        });
        return res.status(201).json({ message: "Staff created successfully" });
    } catch (error) {
        console.error("Create staff error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export async function updateStaff(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const { firstName, lastName, age, gender, phone, email, role, password } = req.body as updateStaffInput;
        let passwordHash: string | undefined;
        if (password) {
            const passwordHash = await hashPassword(password);
        }
        await prisma.staff.update({
            where: { id: id as string },
            data: { firstName, lastName, age, gender, phone, email, role, passwordHash },
        });
        return res.status(200).json({ message: "Staff updated successfully" });
    } catch (error) {
        console.error("Update staff error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export async function blockStaff(req: Request, res: Response) {
    try{
        const {id} = req.params;
        await prisma.staff.update({
            where: { id: id as string },
            data: { isActive: false },
        });
        return res.status(200).json({ message: "Staff blocked successfully" });
    } catch (error) {
        console.error("Block staff error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export async function unblockStaff(req: Request, res: Response) {
    try{
        const {id} = req.params;
        await prisma.staff.update({
            where: { id: id as string },
            data: { isActive: true },
        });
        return res.status(200).json({ message: "Staff unblocked successfully" });
    } catch (error) {
        console.error("Unblock staff error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};