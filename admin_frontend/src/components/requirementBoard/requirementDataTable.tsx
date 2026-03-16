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
import { ExportButton, type ExportColumn } from "../role_management/exportButton";
import { RequirementsFilters, type RequirementStatusFilter } from "./requirementsFilters";

const REQUIREMENT_EXPORT_COLUMNS: ExportColumn[] = [
    { key: "userName", header: "User Name" },
    { key: "email", header: "Email" },
    { key: "preferredLocation", header: "Preferred Location" },
    { key: "amount", header: "Amount" },
    { key: "status", header: "Status" },
];

interface RequirementDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    statusFilter?: RequirementStatusFilter;
    onFilterChange?: (filter: RequirementStatusFilter) => void;
}

export function RequirementDataTable<TData, TValue>({
    columns,
    data,
    statusFilter = "ALL",
    onFilterChange,
}: RequirementDataTableProps<TData, TValue>) {
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [sorting, setSorting] = React.useState<SortingState>([])

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
            const email = String(row.getValue("email") ?? "").toLowerCase()
            const amount = String(row.getValue("amount") ?? "").toLowerCase()
            const status = String(row.getValue("status") ?? "").toLowerCase()
            const location = String(row.getValue("preferredLocation") ?? "").toLowerCase()
            return (
                userName.includes(search) ||
                email.includes(search) ||
                amount.includes(search) ||
                status.includes(search) ||
                location.includes(search) 
            )
        },
    });

    return (
        <div>
            <div className="flex items-center py-4 gap-8 justify-between">
                <h1 className="font-medium text-xl p-2 pl-4">Requirements</h1>
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
                        data={data as Record<string, unknown>[]}
                        columns={REQUIREMENT_EXPORT_COLUMNS}
                        filename="requirements"
                    />
                    {onFilterChange && (
                        <RequirementsFilters
                            filter={statusFilter}
                            onFilterChange={onFilterChange}
                        />
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