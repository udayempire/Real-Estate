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
import { Search, PenLineIcon } from "lucide-react";
import { Button } from "../ui/button";

import { DataTablePagination } from "../ui/data-table-pagination"
import { ExportButton, type ExportColumn } from "./exportButton";
import { useRouter } from "next/navigation";

const exportColumns: ExportColumn[] = [
    { key: "username", header: "User Name" },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    { key: "blockDate", header: "Block Date" },
]

export function DataTable<TData, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [globalFilter, setGlobalFilter] = React.useState("");
    const [sorting, setSorting] = React.useState<SortingState>([])
    const router = useRouter();

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
            const username = String(row.getValue("username") ?? "").toLowerCase()
            const email = String(row.getValue("email") ?? "").toLowerCase()
            const role = String(row.getValue("role") ?? "").toLowerCase()
            return username.includes(search) || email.includes(search) || role.includes(search)
        },
    });

    return (
        <div>
            <div className="flex items-center py-4 gap-8 justify-between">
                <h1 className="font-medium text-[20px] p-2 pl-4">Admin Staff</h1>
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
                        columns={exportColumns}
                        filename="admin-staff"
                    />
                    <Button onClick={() => {
                        router.push("/role-management/add-new-staff");
                    }}>
                        <PenLineIcon className="size-4 " />
                        Add New Staff
                    </Button>
                </div>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow className="bg-[#F1F7FE]" key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead className="font-medium text-sm" key={header.id}>
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