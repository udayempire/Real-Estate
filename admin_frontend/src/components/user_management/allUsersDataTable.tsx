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
} from "@tanstack/react-table"

import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Search } from "lucide-react"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { ExportButton, type ExportColumn } from "@/components/role_management/exportButton"
import { UsersFilter, type UsersFilterState, applyUsersFilter } from "./usersFilter"

type FilterableUser = { gems?: number; isVerifiedSeller?: boolean; isBlueTick?: boolean }

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

const defaultUsersFilter: UsersFilterState = {
    verifiedSeller: "all",
    blueTick: "all",
    gemsMin: "",
    gemsMax: "",
    blockedOnMin: "",
    blockedOnMax: "",
}

export function AllUsersDataTable<TData extends FilterableUser, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [globalFilter, setGlobalFilter] = React.useState("")
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [filters, setFilters] = React.useState<UsersFilterState>(defaultUsersFilter)

    const filteredData = React.useMemo(
        () => applyUsersFilter(data, filters),
        [data, filters]
    )

    const table = useReactTable({
        data: filteredData,
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
            const kycStatus = String(row.getValue("kycStatus") ?? "").toLowerCase()
            return username.includes(search) || email.includes(search) || kycStatus.includes(search)
        },
    })

    const allUsersExportColumns: ExportColumn[] = [
        { key: "username", header: "User Name" },
        { key: "email", header: "Email" },
        { key: "gems", header: "Gems" },
        { key: "kycStatus", header: "KYC Status" },
        { key: "propertyListings.total", header: "Total Properties" },
        { key: "propertyListings.sold", header: "Sold" },
        { key: "propertyListings.active", header: "Active" },
        { key: "propertyListings.unlisted", header: "Unlisted" },
        { key: "isBlocked", header: "Blocked" },
    ]
    const exportData = table.getFilteredRowModel().rows.map((r) => r.original as Record<string, unknown>)

    return (
        <div>
            <div className="flex items-center py-4 gap-4 justify-between">
                <h1 className="font-semibold text-xl whitespace-nowrap pl-4">Users</h1>
                <div className="flex items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            placeholder="Search anything"
                            value={globalFilter}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="h-10 pl-9 border-2 bg-white"
                        />
                    </div>
                    <ExportButton
                        data={exportData}
                        columns={allUsersExportColumns}
                        filename="all-users"
                    />
                    <UsersFilter filters={filters} onFiltersChange={setFilters} />
                    {/* <Button variant="outline" className="gap-2 shadow-none border-2 h-10">
                        <ArrowUpDown className="size-4" />
                        Sort by
                        <ChevronDown className="size-4" />
                    </Button> */}
                </div>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow className="bg-[#F1F7FE]" key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead className="font-medium text-sm" key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
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
