 "use client";

import { useEffect, useState } from "react";
import { columns } from "@/components/Financials/financialColumns";
import { FinancialsDataTable } from "@/components/Financials/financialsDatatable";
import FinancialsTopBar from "@/components/Financials/financialsTopBar";
import { financeTableInterface } from "@/components/Financials/financialColumns";
import { api } from "@/lib/api";

type TransactionsResponse = {
    success: boolean;
    data: Array<{
        id: string;
        user: string;
        reason: string;
        amount: number;
        createdAt: string;
        details: {
            txnType: "CREDIT" | "DEBIT";
            balanceBefore: number;
            balanceAfter: number;
        };
        staffHandler: string;
        propertyId: string | null;
    }>;
};

const toTitleCase = (value: string) =>
    value
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

export default function FinancialsPage() {
    const [data, setData] = useState<financeTableInterface[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchFinancials = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const response = await api.get<TransactionsResponse>("/staff/gems/transactions", {
                    params: { page: 1, limit: 100 },
                });

                if (!isMounted) return;

                const mapped = response.data.data.map((txn) => ({
                    userName: txn.user,
                    purpose: toTitleCase(txn.reason),
                    staffHandler: txn.staffHandler,
                    amount: txn.amount.toLocaleString(),
                    details: new Date(txn.createdAt).toLocaleString(),
                    status: txn.details.txnType === "CREDIT" ? "Completed" : "Pending",
                    propertyId: txn.propertyId ?? null,
                }));

                setData(mapped);
            } catch (err) {
                if (!isMounted) return;
                console.error("Failed to fetch gem transactions:", err);
                setError("Failed to load transaction history");
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchFinancials();
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className="mt-4">
            <FinancialsTopBar />
            {isLoading && <p className="text-sm text-gray-500 px-4 mt-4">Loading transaction history...</p>}
            {error && <p className="text-sm text-red-500 px-4 mt-4">{error}</p>}
            {!isLoading && !error && <FinancialsDataTable columns={columns} data={data} />}
        </div>
    )
}