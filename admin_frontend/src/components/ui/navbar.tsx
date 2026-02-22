import Image from "next/image";
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { LogOut } from "lucide-react";
export const Navbar = () => {
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
                    <LogOut className="w-8 h-8 text-red-500" />
                </div>
            </div>
        </div>
    );
};