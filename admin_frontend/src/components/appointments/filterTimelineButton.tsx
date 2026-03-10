import { Button } from "@/components/ui/button"

import { Calendar } from "lucide-react"

export function FilterTimelineButton() {
    return (
        <div>
            <Button variant="outline" className="hover:bg-zinc-50 gap-2 shadow-none border-2 h-10">
                <Calendar className="size-4 text-blue-500" />
                Choose from Calendar
            </Button>
        </div>
    )
}