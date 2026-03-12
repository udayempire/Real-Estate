import { BadgeCheckIcon } from "lucide-react"

export const BlueTick = ({size = 5}: {size?: number}) => {
    return (
        <div>
            <BadgeCheckIcon className={`size-${size} fill-blue-500 text-white`} />
        </div>
    )
}