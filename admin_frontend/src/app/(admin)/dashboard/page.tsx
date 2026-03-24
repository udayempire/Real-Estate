import { AnalyticsCards } from "@/components/dashboard/analyticsCards";
import { MyChart } from "@/components/dashboard/userAnalytics";
import { InventoryVelocityChart } from "@/components/dashboard/inventoryVelocity";

export default function Dashboard() {
    return (
        <div className="space-y-4">
            <div>
                <AnalyticsCards />
            </div>
            <div>
                <MyChart />
            </div>
            <div>
                <InventoryVelocityChart />
            </div>
        </div>
    );
}