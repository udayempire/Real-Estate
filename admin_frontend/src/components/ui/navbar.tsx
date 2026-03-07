"use client";
import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "./button";
import { useRouter } from "next/navigation";
export const Navbar = () => {
    const router = useRouter();

    const signout = async () => {
        try {
            await api.post("/staff/auth/signout", {});
        } catch (error) {
            console.error("signout error:", error);
        } finally {
            router.push("/signin");
        }
    };

    return (
        <div>
            <div className="flex justify-between p-4  border-b-2 shadow- border-zinc-300 h-18">
                <div className="flex items-center justify-center">
                    <Image src="/realbroLogo2.svg" alt="real bro logo" width={140} height={100} />
                </div>

                <div className="flex items-center justify-center gap-3">
                    <div className="text-xl font-medium">
                        Hi, John Doe
                    </div>
                    <Avatar className="h-12 w-12">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Button
                        variant="ghost"
                        size="icon-lg"
                        className="text-red-500 hover:text-red-600"
                        onClick={signout}
                    >
                        <LogOut className="size-7 text-red-500" />
                    </Button>
                </div>
            </div>
        </div>
    );
};