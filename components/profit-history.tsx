"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TrendingUp,
  Calendar,
  CalendarDays,
  CalendarRange,
  Trash2,
  Clock,
  DollarSign,
  Info,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type Currency = "USD" | "EUR" | "COP" | "MXN"

interface ExchangeRates {
  USD_COP: number
  EUR_COP: number
  USD_EUR: number
  EUR_USD: number
  USD_MXN: number
  EUR_MXN: number
}

const currencyFlags: Record<Currency, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  COP: "🇨🇴",
  MXN: "🇲🇽",
}

export interface ProfitRecord {
  id: string
  date: string
  profit: number
  profitPercent: number
  quota1: number
  quota2: number
  investment: number
  currency: string
}

interface ProfitHistoryProps {
  records: ProfitRecord[]
  onDelete: (id: string) => void
  onClearAll: () => void
  exchangeRates: ExchangeRates
}

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  COP: "$",
  MXN: "$",
}

function formatCurrency(amount: number, currency: string): string {
  const decimals = currency === "COP" || currency === "MXN" ? 0 : 2
  const formatted = Math.abs(amount).toFixed(decimals)
  const sign = amount >= 0 ? "+" : "-"
  return `${sign}${currencySymbols[currency] || "$"}${formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return date >= weekStart
}

function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
}

export function ProfitHistory({ records, onDelete, onClearAll, exchangeRates }: ProfitHistoryProps) {
  const [mounted, setMounted] = useState(false)
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("USD")
  const currency = displayCurrency; // Declare the currency variable

  useEffect(() => {
    setMounted(true)
  }, [])

  // Convert any currency to the display currency
  const convertToDisplayCurrency = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === displayCurrency) return amount
    
    // First convert to USD
    let amountInUSD = amount
    if (fromCurrency === "EUR") amountInUSD = amount * exchangeRates.EUR_USD
    else if (fromCurrency === "COP") amountInUSD = amount / exchangeRates.USD_COP
    else if (fromCurrency === "MXN") amountInUSD = amount / exchangeRates.USD_MXN
    
    // Then convert from USD to display currency
    if (displayCurrency === "EUR") return amountInUSD * exchangeRates.USD_EUR
    else if (displayCurrency === "COP") return amountInUSD * exchangeRates.USD_COP
    else if (displayCurrency === "MXN") return amountInUSD * exchangeRates.USD_MXN
    return amountInUSD
  }

  if (!mounted) return null

  // Sum profits converting each to the display currency
  const todayProfit = records
    .filter((r) => isToday(r.date))
    .reduce((sum, r) => sum + convertToDisplayCurrency(r.profit, r.currency), 0)
  const weekProfit = records
    .filter((r) => isThisWeek(r.date))
    .reduce((sum, r) => sum + convertToDisplayCurrency(r.profit, r.currency), 0)
  const monthProfit = records
    .filter((r) => isThisMonth(r.date))
    .reduce((sum, r) => sum + convertToDisplayCurrency(r.profit, r.currency), 0)
  const totalProfit = records
    .reduce((sum, r) => sum + convertToDisplayCurrency(r.profit, r.currency), 0)

  const todayCount = records.filter((r) => isToday(r.date)).length
  const weekCount = records.filter((r) => isThisWeek(r.date)).length
  const monthCount = records.filter((r) => isThisMonth(r.date)).length

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Currency Selector */}
      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-card p-2">
        <span className="text-xs font-medium text-muted-foreground">Ver totales en:</span>
        <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
          <SelectTrigger className="h-7 w-28 bg-secondary/50 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">{currencyFlags.USD} USD</SelectItem>
            <SelectItem value="EUR">{currencyFlags.EUR} EUR</SelectItem>
            <SelectItem value="COP">{currencyFlags.COP} COP</SelectItem>
            <SelectItem value="MXN">{currencyFlags.MXN} MXN</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Hoy</span>
              <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
                {todayCount}
              </Badge>
            </div>
            <div className={cn("mt-1 text-lg font-bold", todayProfit >= 0 ? "text-primary" : "text-destructive")}>
              {formatCurrency(todayProfit, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Semana</span>
              <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
                {weekCount}
              </Badge>
            </div>
            <div className={cn("mt-1 text-lg font-bold", weekProfit >= 0 ? "text-primary" : "text-destructive")}>
              {formatCurrency(weekProfit, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarRange className="h-3.5 w-3.5" />
              <span>Mes</span>
              <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
                {monthCount}
              </Badge>
            </div>
            <div className={cn("mt-1 text-lg font-bold", monthProfit >= 0 ? "text-primary" : "text-destructive")}>
              {formatCurrency(monthProfit, currency)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/10">
          <CardContent className="p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>Total</span>
              <Badge variant="default" className="ml-auto h-4 px-1.5 text-[10px]">
                {records.length}
              </Badge>
            </div>
            <div className={cn("mt-1 text-lg font-bold", totalProfit >= 0 ? "text-primary" : "text-destructive")}>
              {formatCurrency(totalProfit, currency)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records List */}
      <Card className="flex-1 overflow-hidden border-border/50 bg-card">
        <CardContent className="flex h-full flex-col p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-card-foreground">
              <Clock className="h-4 w-4 text-primary" />
              Historial de Ganancias
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground/60 transition-colors hover:text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[200px] text-center">
                    <p className="text-xs">Los datos se guardan en tu navegador. Si borras el cache o los datos del sitio, se perderan las ganancias.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            {records.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
                Borrar todo
              </Button>
            )}
          </div>

          {records.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <TrendingUp className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin registros</p>
              <p className="text-xs text-muted-foreground/70">Guarda tus ganancias desde la calculadora</p>
            </div>
          ) : (
            <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {records
                .slice()
                .reverse()
                .map((record) => (
                  <div
                    key={record.id}
                    className="group flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 p-2 transition-colors hover:bg-secondary/40"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-base font-bold", record.profit >= 0 ? "text-primary" : "text-destructive")}>
                          {formatCurrency(record.profit, record.currency)}
                        </span>
                        <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-semibold">
                          {record.currency}
                        </Badge>
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                          {record.profitPercent >= 0 ? "+" : ""}
                          {record.profitPercent.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>{formatDate(record.date)}</span>
                        <span className="opacity-50">|</span>
                        <span>
                          C1: {record.quota1.toFixed(2)} / C2: {record.quota2.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(record.id)}
                      className="h-7 w-7 p-0 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
