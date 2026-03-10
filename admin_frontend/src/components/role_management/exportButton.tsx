"use client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Upload, ChevronDown } from "lucide-react"
import * as XLSX from "xlsx"

export type ExportColumn = {
    key: string
    header: string
}

type ExportButtonProps = {
    data?: Record<string, unknown>[]
    columns?: ExportColumn[]
    filename?: string
}

function escapeCsvValue(value: unknown): string {
    if (value == null) return ""
    const str = String(value)
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return str
}

function downloadFile(content: string | Blob, filename: string, mimeType: string) {
    const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export function ExportButton({ data, columns, filename = "export" }: ExportButtonProps) {
    const hasExportData = data && columns && columns.length > 0 && data.length > 0

    const handleExportCsv = () => {
        if (!hasExportData) return
        const headers = columns!.map((c) => c.header).join(",")
        const rows = data!.map((row) =>
            columns!.map((c) => escapeCsvValue(getNestedValue(row, c.key))).join(",")
        )
        const csv = [headers, ...rows].join("\n")
        const BOM = "\uFEFF"
        downloadFile(BOM + csv, `${filename}.csv`, "text/csv;charset=utf-8")
    }

    const handleExportXlsx = () => {
        if (!hasExportData) return
        const rows = data!.map((row) =>
            columns!.reduce(
                (acc, col) => {
                    acc[col.header] = getNestedValue(row, col.key)
                    return acc
                },
                {} as Record<string, unknown>
            )
        )
        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Sheet1")
        const xlsxBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" })
        downloadFile(new Blob([xlsxBuffer]), `${filename}.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    }

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="hover:bg-zinc-50 gap-2 shadow-none border-2 h-10">
                        <Upload className="size-4 text-blue-500" />
                        Export
                        <ChevronDown className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuGroup>
                        <DropdownMenuItem
                            className="font-medium"
                            onClick={handleExportXlsx}
                            disabled={!hasExportData}
                        >
                            Export as XLSX
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="font-medium"
                            onClick={handleExportCsv}
                            disabled={!hasExportData}
                        >
                            Export as CSV
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
    if (key.includes(".")) {
        const parts = key.split(".")
        let val: unknown = obj
        for (const p of parts) {
            val = (val as Record<string, unknown>)?.[p]
        }
        return val
    }
    return obj[key]
}
