import { CalendarClockIcon, CalendarCheck2, CalendarSyncIcon, TimerReset, CalendarDaysIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

type AppointmentsTopBarProps = {
    totalScheduled: number;
    totalPendingApprovals: number;
    scheduledToday: number;
    completedToday: number;
    waitingToday: number;
};

const formatCount = (value: number) => String(value).padStart(2, "0");

export default function AppointmentsTopBar({
    totalScheduled,
    totalPendingApprovals,
    scheduledToday,
    completedToday,
    waitingToday,
}: AppointmentsTopBarProps) {
    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="font-medium text-xl">Appointments</h1>
            </div>
            <div className="grid grid-cols-5 gap-3 mt-3">
                <Card className="border py-3 gap-1">
                    <CardHeader className="px-4 py-0 font-extralight">
                        <CardTitle className="flex justify-between items-center gap-2">
                            <CalendarDaysIcon className={`size-7 font-extralight text-blue-500`} strokeWidth={1.5} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                        <h1 className="font-bold text-2xl">{formatCount(totalScheduled)}</h1>
                        <p className="text-gray-500 font-medium text-[12px]">Total Scheduled</p>
                    </CardContent>
                </Card>
                <Card className="border py-3 gap-1">
                    <CardHeader className="px-4 py-0 font-extralight">
                        <CardTitle className="flex justify-between items-center gap-2">
                            <TimerReset className={`size-7 font-extralight text-orange-500`} strokeWidth={1.5} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                        <h1 className="font-bold text-2xl">{formatCount(totalPendingApprovals)}</h1>
                        <p className="text-gray-500 font-medium text-[12px]">Total Pending Approvals</p>
                    </CardContent>
                </Card>
                <Card className="col-span-3 border py-3 gap-2">
                    <CardHeader className="px-4 py-0">
                        <CardTitle className="flex justify-between items-center">
                            <h1 className="font-medium text-base">Day Insights</h1>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4">
                        <div className="grid grid-cols-3 gap-3 ml-16">
                            <div className="flex items-center gap-2">
                                <CalendarClockIcon size={20} className="text-blue-500" strokeWidth={1.5} />
                                <div>
                                    <h1 className="text-[15px] font-bold">{formatCount(scheduledToday)}</h1>
                                    <p className="text-[12px] text-gray-500 font-medium">Scheduled for Today</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarCheck2 size={20} className="text-green-500" strokeWidth={1.5} />
                                <div>
                                    <h1 className="text-[15px] font-bold">{formatCount(completedToday)}</h1>
                                    <p className="text-[12px] text-gray-500 font-medium">Completed Today</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <CalendarSyncIcon size={20} className="text-red-500" strokeWidth={1.5} />
                                <div>
                                    <h1 className="text-[15px] font-bold text-red-500">{formatCount(waitingToday)}</h1>
                                    <p className="text-[12px] text-gray-500 font-medium">Waiting Today</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
