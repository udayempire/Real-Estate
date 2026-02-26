import { columns } from "@/components/Financials/financialColumns";
import { FinancialsDataTable } from "@/components/Financials/financialsDatatable";
import FinancialsTopBar from "@/components/Financials/financialsTopBar";
// import FinancialsDataTable from "@components/Financials/financialsDatatable"
import { financeTableInterface } from "@/components/Financials/financialColumns";

async function getFinancials(): Promise<financeTableInterface[]> {
    // const response = await axios.get("https://api.example.com/role-management")
    // const data = await response.json()
    // return data
    return [
        
            {
              userName: "Uday Kumar",
              purpose: "3 BHK Flat in Arera Colony",
              staffHandler: "Rajun Kumar",
              amount: "10000",
              details: "12th Feb, 2025",
              status: "Completed",
            },
            {
              userName: "Ankit Sharma",
              purpose: "2 BHK Apartment in MP Nagar",
              staffHandler: "Priya Verma",
              amount: "7500",
              details: "15th Feb, 2025",
              status: "Pending",
            },
            {
              userName: "Rohit Singh",
              purpose: "Office Space in Zone 1",
              staffHandler: "Amit Tiwari",
              amount: "25000",
              details: "18th Feb, 2025",
              status: "Rejected",
            },
            {
              userName: "Sneha Patel",
              purpose: "Villa in Kolar Road",
              staffHandler: "Rajun Kumar",
              amount: "50000",
              details: "20th Feb, 2025",
              status: "Completed",
            },
            {
              userName: "Vikram Joshi",
              purpose: "1 BHK Rental in Govindpura",
              staffHandler: "Neha Singh",
              amount: "6000",
              details: "22nd Feb, 2025",
              status: "Pending",
            },
            {
              userName: "Megha Rao",
              purpose: "Commercial Shop in New Market",
              staffHandler: "Amit Tiwari",
              amount: "18000",
              details: "24th Feb, 2025",
              status: "Completed",
            },
            {
              userName: "Arjun Mehta",
              purpose: "Plot Purchase in Hoshangabad Road",
              staffHandler: "Priya Verma",
              amount: "40000",
              details: "26th Feb, 2025",
              status: "Rejected",
            },
            {
              userName: "Kunal Deshmukh",
              purpose: "2 BHK Flat in Bawadia Kalan",
              staffHandler: "Neha Singh",
              amount: "12000",
              details: "28th Feb, 2025",
              status: "Completed",
            },
          
    ]
}
export default async function FinancialsPage() {
    const data = await getFinancials();
    return (
        <div className="mt-4">
            <FinancialsTopBar />
            <FinancialsDataTable columns={columns} data={data} />
        </div>
    )
}