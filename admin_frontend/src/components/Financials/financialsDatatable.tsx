"use client"
import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getFilteredRowModel,
    SortingState,
    getSortedRowModel,
} from "@tanstack/react-table";

import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Search } from "lucide-react";

import { DataTablePagination } from "../ui/data-table-pagination"
import { ExportButton, type ExportColumn } from "../role_management/exportButton"
import { Filter } from "./filter"
import { FilterTimelineButton, type DateFilterParams } from "./filterTimelineButton"
import type { FinancialsFilterState } from "./filter"

interface FinancialsDataTableProps<TData, TValue> extends DataTableProps<TData, TValue> {
    onDateFilterChange?: (params: DateFilterParams | null) => void
    activeDateFilter?: DateFilterParams | null
    filters?: FinancialsFilterState
    onFiltersChange?: (f: FinancialsFilterState) => void
}

export function FinancialsDataTable<TData, TValue>({
    columns,
    data,
    onDateFilterChange,
    activeDateFilter,
    filters,
    onFiltersChange,
}: FinancialsDataTableProps<TData, TValue>) {
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [sorting, setSorting] = React.useState<SortingState>([]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            globalFilter,
            sorting,
        },
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: (row, _columnId, filterValue) => {
            const search = filterValue.toLowerCase()
            const userName = String(row.getValue("userName") ?? "").toLowerCase()
            const purpose = String(row.getValue("purpose") ?? "").toLowerCase()
            const staffHandler = String(row.getValue("staffHandler") ?? "").toLowerCase()
            const amount = String(row.getValue("amount") ?? "").toLowerCase()
            const details = String(row.getValue("details") ?? "").toLowerCase()
            const status = String(row.getValue("status") ?? "").toLowerCase()
            return (
                userName.includes(search) ||
                purpose.includes(search) ||
                staffHandler.includes(search) ||
                amount.includes(search) ||
                details.includes(search) ||
                status.includes(search)
            )
        },
    })

    const financialsExportColumns: ExportColumn[] = [
        { key: "userName", header: "User Name" },
        { key: "purpose", header: "Purpose" },
        { key: "staffHandler", header: "Staff Handler" },
        { key: "amount", header: "Amount" },
        { key: "details", header: "Details" },
        { key: "status", header: "Status" },
    ]
    const exportData = table.getFilteredRowModel().rows.map((r) => r.original as Record<string, unknown>)

    return (
        <div>
            <div className="flex items-center py-4 gap-8 justify-between">
                <h1 className="font-medium text-lg p-2 pl-4">Transaction History</h1>
                {/* Search Input Box  */}
                <div className="flex items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-blue-500" />
                        <Input
                            placeholder="Search Anything"
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="h-10 pl-9 border-2 bg-white"
                        />
                    </div>
                    <ExportButton
                        data={exportData}
                        columns={financialsExportColumns}
                        filename="financials-transactions"
                    />
                    <FilterTimelineButton
                        onDateFilterChange={onDateFilterChange ?? undefined}
                        activeFilter={activeDateFilter ?? undefined}
                    />
                    {filters != null && onFiltersChange && (
                        <Filter filters={filters} onFiltersChange={onFiltersChange} />
                    )}

                </div>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow className="bg-[#F1F7FE]" key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead className="font-medium text-lg" key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody className="bg-white">
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <DataTablePagination table={table} />
        </div>
    )
}