"use client";

import { useEffect, useState } from "react";
import { columns } from "@/components/Financials/financialColumns";
import { FinancialsDataTable } from "@/components/Financials/financialsDatatable";
import FinancialsTopBar from "@/components/Financials/financialsTopBar";
import { financeTableInterface } from "@/components/Financials/financialColumns";
import { api } from "@/lib/api";
import type { DateFilterParams } from "@/components/Financials/filterTimelineButton";
import type { FinancialsFilterState } from "@/components/Financials/filter";

type TransactionsResponse = {
    success: boolean;
    data: Array<{
        id: string;
        userId: string;
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

const reasonLabels: Record<string, string> = {
    GEM_REDEEM: "Gem Redeem",
    REFERRAL_BONUS_5_PERCENT: "Referral Reward",
    ACQUISITION_REWARD: "Exclusive Acquisition Reward",
    EXCLUSIVE_SALE_REWARD: "Exclusive Sale Reward",
    REDEMPTION: "Redemption",
};

export default function FinancialsPage() {
    const [data, setData] = useState<financeTableInterface[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateFilter, setDateFilter] = useState<DateFilterParams | null>(null);
    const [filters, setFilters] = useState<FinancialsFilterState>({
        purpose: null,
        status: null,
        amountMin: "",
        amountMax: "",
    });

    useEffect(() => {
        let isMounted = true;

        const fetchFinancials = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const params: Record<string, string | number> = {
                    page: 1,
                    limit: 100,
                };
                if (dateFilter?.date) {
                    params.date = dateFilter.date;
                } else if (dateFilter?.startDate && dateFilter?.endDate) {
                    params.startDate = dateFilter.startDate;
                    params.endDate = dateFilter.endDate;
                }
                if (filters.purpose) params.reason = filters.purpose;
                if (filters.status) params.status = filters.status;
                if (filters.amountMin) params.amountMin = Number(filters.amountMin) || 0;
                if (filters.amountMax) params.amountMax = Number(filters.amountMax) || 0;

                const response = await api.get<TransactionsResponse>("/staff/gems/transactions", {
                    params,
                });

                if (!isMounted) return;

                const mapped = response.data.data.map((txn) => {
                    const isDebit = txn.details.txnType === "DEBIT";
                    const amountStr = isDebit
                        ? `-${txn.amount.toLocaleString()}`
                        : txn.amount.toLocaleString();
                    const purposeLabel = reasonLabels[txn.reason] ?? toTitleCase(txn.reason);
                    return {
                        userId: txn.userId,
                        userName: txn.user,
                        purpose: purposeLabel,
                        staffHandler: txn.staffHandler,
                        amount: amountStr,
                        details: new Date(txn.createdAt).toLocaleString(),
                        status: "Completed",
                        propertyId: txn.propertyId ?? null,
                    };
                });

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
    }, [dateFilter, filters]);

    return (
        <div className="mt-4">
            <FinancialsTopBar />
            {isLoading && <p className="text-sm text-gray-500 px-4 mt-4">Loading transaction history...</p>}
            {error && <p className="text-sm text-red-500 px-4 mt-4">{error}</p>}
            {!isLoading && !error && (
                <FinancialsDataTable
                    columns={columns}
                    data={data}
                    onDateFilterChange={setDateFilter}
                    activeDateFilter={dateFilter}
                    filters={filters}
                    onFiltersChange={setFilters}
                />
            )}
        </div>
    )
}