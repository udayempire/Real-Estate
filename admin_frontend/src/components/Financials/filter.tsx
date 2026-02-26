import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Settings2Icon } from "lucide-react"

export function Filter() {
    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="hover:bg-zinc-50 gap-2 shadow-none border-2 h-10">
                        <Settings2Icon className="size-4 text-blue-500" />
                        Filter
                        <ChevronDown className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                        <DropdownMenuItem className="font-medium">Completed</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-medium">Rejected</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-medium">Pending</DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}