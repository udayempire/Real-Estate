import { ChevronRight, Building2, PencilLine, Gem, Car, Calendar, CalendarClockIcon, CalendarCheck2, CalendarSyncIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function FinancialsTopBar() {
    return (
        <div>
            <div className="flex justify-between items-center">
                <h1 className="font-medium text-xl">Financials</h1>
                <div className="flex gap-2">
                    <Button>
                        <PencilLine />
                        Send Gems to User</Button>
                    <Button>
                        <PencilLine />
                        Add New Payout</Button>
                </div>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
                <Card className="border-2">
                    <CardHeader className="font-extralight">
                        <CardTitle className="flex justify-between items-center gap-2">
                            <Building2 className={`size-7 font-extralight`} strokeWidth={1.5} />
                            <ChevronRight className="size-8 font-extralight text-blue-500" strokeWidth={1.5} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <h1 className="font-bold text-2xl">152,100</h1>
                        <p className="text-gray-500 font-medium">Total worth of Prop.</p>
                    </CardContent>
                </Card>
                <Card className="border-2">
                    <CardHeader className="font-extralight">
                        <CardTitle className="flex justify-between items-center gap-2">
                            <Gem className={`size-7 font-extralight text-green-500`} strokeWidth={1.5} />
                            <ChevronRight className="size-8 font-extralight text-blue-500" strokeWidth={1.5} />
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <h1 className="font-bold text-2xl">45251</h1>
                        <p className="text-gray-500 font-medium">Total worth of Gems</p>
                    </CardContent>
                </Card>
                <Card className="full col-span-2">
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <h1 className="font-medium">Insights</h1>
                            <Button variant="outline" className="shadow-none" size="sm">
                                <Calendar size={5} className="" />
                                Today(15-02-2026)</Button>
                        </CardTitle>
                        <CardContent>
                            <Card >
                                <CardContent className="grid grid-cols-3">
                                    <div className="flex items-center gap-2 ">
                                        <CalendarClockIcon size={30} className="text-blue-500" strokeWidth={1.5} />
                                        <div>
                                            <h1 className="text-[24px] font-bold">12</h1>
                                            <p className=" text-sm text-gray-500 font-medium">Payouts Processed</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ">
                                        <CalendarCheck2 size={30} className="text-green-500" strokeWidth={1.5} />
                                        <div>
                                            <h1 className="text-[24px] font-bold">₹250000</h1>
                                            <p className=" text-sm text-gray-500 font-medium">Total Sell</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 ">
                                        <CalendarSyncIcon size={30} className="text-red-500" strokeWidth={1.5} />
                                        <div>
                                            <h1 className="text-[24px] font-bold text-green-500">+₹25 Lakh</h1>
                                            <p className=" text-sm text-gray-500 font-medium">Cashflow</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </CardContent>
                    </CardHeader>
                </Card>
            </div>
        </div>

    )
}