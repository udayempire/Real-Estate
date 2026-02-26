import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calendar, ChevronDown} from "lucide-react"

export function FilterTimelineButton() {
    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="hover:bg-zinc-50 gap-2 shadow-none border-2 h-10">
                        <Calendar className="size-4 text-blue-500" />
                        Past 1 Month
                        <ChevronDown className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                        <DropdownMenuItem className="font-medium">Last 3 Months</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-medium">Last 2 Weeks</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="font-medium">Choose your own</DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}