"use client"

import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Calendar } from "lucide-react"

type PropertiesAnalyticsCompact = {
  propertiesAddedTotal: number
  propertiesSoldTotal: number
}

type PresetKey = "today" | "7d" | "1m" | "6m" | "1y"

type DateBucket = {
  start: Date
  end: Date
  label: string
}

const chartConfig = {
  added: {
    label: "Properties Added",
    color: "#3b82f6",
  },
  sold: {
    label: "Properties Sold",
    color: "#94a3b8",
  },
} satisfies ChartConfig

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatAsYmd(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function dateLabel(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date)
}

function buildBuckets(start: Date, end: Date, stepDays: number): DateBucket[] {
  const buckets: DateBucket[] = []
  let cursor = startOfDay(start)
  const endBound = endOfDay(end)

  while (cursor <= endBound) {
    const bucketStart = startOfDay(cursor)
    const bucketEnd = endOfDay(addDays(bucketStart, stepDays - 1))
    const clampedEnd = bucketEnd > endBound ? endBound : bucketEnd

    buckets.push({
      start: bucketStart,
      end: clampedEnd,
      label: stepDays === 1 ? dateLabel(bucketStart) : `${dateLabel(bucketStart)} - ${dateLabel(clampedEnd)}`,
    })

    cursor = startOfDay(addDays(bucketStart, stepDays))
  }

  return buckets
}

function getPresetRange(preset: PresetKey): { start: Date; end: Date; stepDays: number } {
  const now = new Date()
  const end = endOfDay(now)

  if (preset === "today") {
    return { start: startOfDay(now), end, stepDays: 1 }
  }
  if (preset === "7d") {
    return { start: startOfDay(addDays(now, -6)), end, stepDays: 1 }
  }
  if (preset === "1m") {
    return { start: startOfDay(addDays(now, -29)), end, stepDays: 1 }
  }
  if (preset === "6m") {
    return { start: startOfDay(addDays(now, -179)), end, stepDays: 7 }
  }
  return { start: startOfDay(addDays(now, -364)), end, stepDays: 15 }
}

function getCustomStepDays(start: Date, end: Date): number {
  const diffMs = endOfDay(end).getTime() - startOfDay(start).getTime()
  const totalDays = Math.max(Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1, 1)

  if (totalDays <= 14) return 1
  if (totalDays <= 60) return 2
  if (totalDays <= 180) return 7
  return 15
}

export function InventoryVelocityChart() {
  const [preset, setPreset] = useState<PresetKey>("7d")
  const [showCustomPanel, setShowCustomPanel] = useState(false)
  const [customFrom, setCustomFrom] = useState("")
  const [customTo, setCustomTo] = useState("")
  const [customApplied, setCustomApplied] = useState<{ from: string; to: string } | null>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard", "inventory-velocity", preset, customApplied?.from, customApplied?.to],
    queryFn: async () => {
      let start: Date
      let end: Date
      let stepDays: number

      if (customApplied) {
        start = startOfDay(new Date(customApplied.from))
        end = endOfDay(new Date(customApplied.to))
        stepDays = getCustomStepDays(start, end)
      } else {
        const presetRange = getPresetRange(preset)
        start = presetRange.start
        end = presetRange.end
        stepDays = presetRange.stepDays
      }

      const buckets = buildBuckets(start, end, stepDays)

      const points = await Promise.all(
        buckets.map(async (bucket) => {
          const from = formatAsYmd(bucket.start)
          const to = formatAsYmd(bucket.end)

          const response = await api.get<{ success: boolean; data: PropertiesAnalyticsCompact }>(
            `/analytics/properties?view=compact&from=${from}&to=${to}`
          )

          return {
            bucket: bucket.label,
            propertiesAdded: response.data.data.propertiesAddedTotal,
            propertiesSold: response.data.data.propertiesSoldTotal,
          }
        })
      )

      return points
    },
    staleTime: 60 * 1000,
  })

  const chartData = useMemo(() => data ?? [], [data])

  const rangeLabel = customApplied
    ? `${customApplied.from} to ${customApplied.to}`
    : ({
      today: "Today",
      "7d": "Last 7 Days",
      "1m": "Last 1 Month",
      "6m": "Last 6 Months",
      "1y": "Last 1 Year",
    } as const)[preset]

  const applyCustomRange = () => {
    if (!customFrom || !customTo) return
    if (new Date(customFrom) > new Date(customTo)) return
    setCustomApplied({ from: customFrom, to: customTo })
  }

  const clearCustomRange = () => {
    setCustomApplied(null)
  }

  if (isError) {
    return <div className="rounded-lg border p-4 text-sm text-red-500">Failed to load inventory velocity.</div>
  }

  return (
    <div className="rounded-lg border p-4 bg-white">
      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Inventory Velocity</h3>
          <p className="text-xs text-muted-foreground">{rangeLabel}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Button
            size="sm"
            className= "bg-blue-600 text-white hover:bg-blue-700 font-medium"
            onClick={() => setShowCustomPanel((prev) => !prev)}
          >
            Select Date Range
            <Calendar className="text-zinc-100 size-4 ml-1" />
          </Button>

          <Select
            value={preset}
            onValueChange={(value) => {
              setPreset(value as PresetKey)
              setCustomApplied(null)
            }}
          >
            <SelectTrigger className="w-42.5  font-medium text-black">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="1m">1 Month</SelectItem>
              <SelectItem value="6m">6 Months</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showCustomPanel && (
        <div className="mb-3 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto_auto]">
          <Input
            type="date"
            className="border-zinc-300 font-medium  border-2 text-black"
                value={customFrom}
            onChange={(e) => setCustomFrom(e.target.value)}
          />
          <Input
            type="date"
            className="border-zinc-300 font-medium  border-2 text-black"
            value={customTo}
            onChange={(e) => setCustomTo(e.target.value)}
          />
          <Button
            size="sm"
            onClick={applyCustomRange}
            disabled={!customFrom || !customTo || new Date(customFrom) > new Date(customTo)}
          >
            Apply
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-blue-500 hover:bg-blue-50"
            onClick={clearCustomRange}
          >
            Use Preset
          </Button>
        </div>
      )}

      <div className="relative">
        <ChartContainer config={chartConfig} className="h-65 w-full">
          <BarChart data={chartData} barCategoryGap={18} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="bucket"
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
            />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="propertiesAdded" name="added" fill="var(--color-added)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="propertiesSold" name="sold" fill="var(--color-sold)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/70 backdrop-blur-[1px]">
            <div className="flex h-52 w-full max-w-2xl items-end justify-center gap-3 px-6">
              <Skeleton className="h-22 w-4 rounded-t-md bg-blue-200/70" />
              <Skeleton className="h-14 w-4 rounded-t-md bg-slate-300/80" />
              <Skeleton className="h-18 w-4 rounded-t-md bg-blue-200/70" />
              <Skeleton className="h-20 w-4 rounded-t-md bg-slate-300/80" />
              <Skeleton className="h-28 w-4 rounded-t-md bg-blue-200/70" />
              <Skeleton className="h-16 w-4 rounded-t-md bg-slate-300/80" />
              <Skeleton className="h-34 w-4 rounded-t-md bg-blue-200/70" />
              <Skeleton className="h-24 w-4 rounded-t-md bg-slate-300/80" />
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded bg-blue-500" />
          Properties Added
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded bg-slate-400" />
          Properties Sold
        </div>
      </div>
    </div>
  )
}
