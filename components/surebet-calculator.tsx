"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calculator,
  ArrowRightLeft,
  Target,
  Building2,
  Home,
  Sparkles,
  RefreshCw,
  Save,
  History,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ProfitHistory, type ProfitRecord } from "./profit-history"

type Currency = "USD" | "EUR" | "COP" | "MXN"

interface ExchangeRates {
  USD_COP: number
  EUR_COP: number
  USD_EUR: number
  EUR_USD: number
  USD_MXN: number
  EUR_MXN: number
}

interface CalculationResult {
  isSurebet: boolean
  profitPercent: number
  stake1: number
  stake2: number
  profit: number
  totalReturn: number
}

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  COP: "$",
  MXN: "$",
}

const currencyFlags: Record<Currency, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  COP: "🇨🇴",
  MXN: "🇲🇽",
}

const STORAGE_KEY = "surebet-profit-history"

export function SurebetCalculator() {
  const [quota1, setQuota1] = useState<string>("")
  const [quota2, setQuota2] = useState<string>("")
  const [investment, setInvestment] = useState<string>("100")
  const [baseCurrency, setBaseCurrency] = useState<Currency>("USD")
  const [currency1, setCurrency1] = useState<Currency>("USD")
  const [currency2, setCurrency2] = useState<Currency>("USD")
  const [currencyProfit, setCurrencyProfit] = useState<Currency>("USD")
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({
    USD_COP: 4300,
    EUR_COP: 4600,
    USD_EUR: 0.93,
    EUR_USD: 1.08,
    USD_MXN: 17.5,
    EUR_MXN: 18.8,
  })
  const [ratesStatus, setRatesStatus] = useState<"loading" | "online" | "offline">("loading")
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [profitRecords, setProfitRecords] = useState<ProfitRecord[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load records from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setProfitRecords(parsed)
      } catch {
        console.error("Error parsing stored records")
      }
    }
  }, [])

  // Save records to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profitRecords))
  }, [profitRecords])

  useEffect(() => {
    const fetchRates = async () => {
      setRatesStatus("loading")
      try {
        const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD")
        const data = await response.json()
        if (data?.rates) {
          setExchangeRates({
            USD_COP: data.rates.COP,
            EUR_COP: data.rates.COP / data.rates.EUR,
            USD_EUR: data.rates.EUR,
            EUR_USD: 1 / data.rates.EUR,
            USD_MXN: data.rates.MXN,
            EUR_MXN: data.rates.MXN / data.rates.EUR,
          })
          setRatesStatus("online")
        }
      } catch {
        setRatesStatus("offline")
      }
    }
    fetchRates()
  }, [])

  const convertCurrency = useCallback(
    (amount: number, from: Currency, to: Currency): number => {
      if (from === to) return amount
      let amountInUSD = amount
      if (from === "EUR") amountInUSD = amount * exchangeRates.EUR_USD
      else if (from === "COP") amountInUSD = amount / exchangeRates.USD_COP
      else if (from === "MXN") amountInUSD = amount / exchangeRates.USD_MXN
      if (to === "EUR") return amountInUSD * exchangeRates.USD_EUR
      else if (to === "COP") return amountInUSD * exchangeRates.USD_COP
      else if (to === "MXN") return amountInUSD * exchangeRates.USD_MXN
      return amountInUSD
    },
    [exchangeRates]
  )

  const formatCurrency = (amount: number, currency: Currency): string => {
    const decimals = currency === "COP" || currency === "MXN" ? 0 : 2
    const formatted = amount.toFixed(decimals)
    return `${currencySymbols[currency]}${formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
  }

  useEffect(() => {
    const q1 = parseFloat(quota1)
    const q2 = parseFloat(quota2)
    const inv = parseFloat(investment)
    if (!q1 || !q2 || q1 <= 0 || q2 <= 0) {
      setResult(null)
      return
    }
    const calculation = 1 / q1 + 1 / q2
    const isSurebet = calculation < 1
    const profitPercent = (1 / calculation - 1) * 100
    const totalStake = inv || 100
    const stake1 = totalStake / q1 / calculation
    const stake2 = totalStake / q2 / calculation
    const totalReturn = stake1 * q1
    const profit = totalReturn - totalStake
    setResult({ isSurebet, profitPercent, stake1, stake2, profit, totalReturn })
  }, [quota1, quota2, investment])

  const handleSaveProfit = () => {
    if (!result) return

    const newRecord: ProfitRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      profit: convertCurrency(result.profit, baseCurrency, currencyProfit),
      profitPercent: result.profitPercent,
      quota1: parseFloat(quota1),
      quota2: parseFloat(quota2),
      investment: parseFloat(investment),
      currency: currencyProfit,
    }

    setProfitRecords((prev) => [...prev, newRecord])
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const handleDeleteRecord = (id: string) => {
    setProfitRecords((prev) => prev.filter((r) => r.id !== id))
  }

  const handleClearAll = () => {
    setProfitRecords([])
  }

  return (
    <div className="flex min-h-screen flex-col bg-background p-2 md:p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-center gap-2">
        <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-1.5">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Calculadora Surebet</h1>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="calculator" className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
        <TabsList className="mx-auto mb-2 grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="calculator" className="gap-1.5 text-xs">
            <Calculator className="h-3.5 w-3.5" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" />
            Mis Ganancias
            {profitRecords.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
                {profitRecords.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Calculator Tab */}
        <TabsContent value="calculator" className="mt-0 flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-2 lg:flex-row">
            {/* Left Column - Inputs */}
            <Card className="flex-1 border-border/50 bg-card shadow-lg">
              <CardContent className="space-y-2 p-3">
                {/* Quotas */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="quota1" className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Home className="h-3 w-3" />
                      Cuota 1
                    </Label>
                    <Input
                      id="quota1"
                      type="number"
                      step="0.01"
                      placeholder="Ej: 2.10"
                      value={quota1}
                      onChange={(e) => setQuota1(e.target.value)}
                      className="h-10 bg-secondary/50 text-base font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="quota2" className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      Cuota 2
                    </Label>
                    <Input
                      id="quota2"
                      type="number"
                      step="0.01"
                      placeholder="Ej: 2.05"
                      value={quota2}
                      onChange={(e) => setQuota2(e.target.value)}
                      className="h-10 bg-secondary/50 text-base font-bold"
                    />
                  </div>
                </div>

                {/* Investment */}
                <div className="space-y-1">
                  <Label htmlFor="investment" className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Inversion Total
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="investment"
                      type="number"
                      step="1"
                      placeholder="Ej: 1000"
                      value={investment}
                      onChange={(e) => setInvestment(e.target.value)}
                      className="h-10 flex-1 bg-secondary/50 text-base font-bold"
                    />
                    <Select value={baseCurrency} onValueChange={(v) => setBaseCurrency(v as Currency)}>
                      <SelectTrigger className="h-10 w-24 bg-secondary/50 text-sm font-semibold">
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
                </div>

                {/* Exchange Rates */}
                <div className="rounded-lg bg-secondary/30 p-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <ArrowRightLeft className="h-3 w-3" />
                      Tasas
                    </span>
                    <Badge
                      variant={ratesStatus === "online" ? "default" : ratesStatus === "loading" ? "secondary" : "destructive"}
                      className="h-4 gap-0.5 px-1 text-[9px]"
                    >
                      {ratesStatus === "loading" && <RefreshCw className="h-2 w-2 animate-spin" />}
                      {ratesStatus === "online" ? "Online" : ratesStatus === "loading" ? "..." : "Offline"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-x-2 gap-y-0.5 text-[10px]">
                    <div className="text-muted-foreground">
                      1 USD = <span className="font-bold text-primary">{exchangeRates.USD_COP.toFixed(0)}</span> COP
                    </div>
                    <div className="text-muted-foreground">
                      1 EUR = <span className="font-bold text-primary">{exchangeRates.EUR_COP.toFixed(0)}</span> COP
                    </div>
                    <div className="text-muted-foreground">
                      1 USD = <span className="font-bold text-primary">{exchangeRates.USD_MXN.toFixed(2)}</span> MXN
                    </div>
                    <div className="text-muted-foreground">
                      1 EUR = <span className="font-bold text-primary">{exchangeRates.EUR_MXN.toFixed(2)}</span> MXN
                    </div>
                    <div className="text-muted-foreground">
                      1 USD = <span className="font-bold text-primary">{exchangeRates.USD_EUR.toFixed(3)}</span> EUR
                    </div>
                    <div className="text-muted-foreground">
                      1 EUR = <span className="font-bold text-primary">{exchangeRates.EUR_USD.toFixed(3)}</span> USD
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Results */}
            <div className="flex flex-1 flex-col gap-2">
              {result ? (
                <>
                  {/* Profit Card */}
                  <Card
                    className={cn(
                      "overflow-hidden border-0 text-white shadow-lg",
                      result.isSurebet
                        ? "bg-gradient-to-br from-emerald-600 to-teal-500"
                        : "bg-gradient-to-br from-red-600 to-orange-500"
                    )}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="mb-0.5 flex items-center justify-center gap-1.5">
                        {result.isSurebet ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {result.isSurebet ? "Surebet Encontrada" : "No es Surebet"}
                        </span>
                      </div>
                      <div className="text-4xl font-black tabular-nums">
                        {result.profitPercent >= 0 ? "+" : ""}
                        {result.profitPercent.toFixed(2)}%
                      </div>
                    </CardContent>
                  </Card>

                  {/* Distribution */}
                  <Card className="flex-1 border-border/50 bg-card shadow-lg">
                    <CardContent className="flex h-full flex-col gap-1.5 p-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-card-foreground">
                        <Calculator className="h-3.5 w-3.5 text-primary" />
                        Distribucion
                      </div>

                      {/* Stake 1 */}
                      <div className="rounded-md border border-border/50 bg-secondary/30 p-2">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <Home className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-card-foreground">Cuota 1</span>
                          </div>
                          <Select value={currency1} onValueChange={(v) => setCurrency1(v as Currency)}>
                            <SelectTrigger className="h-6 w-20 bg-background/50 text-[10px]">
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
                        <div className="text-right text-lg font-black text-primary">
                          {formatCurrency(convertCurrency(result.stake1, baseCurrency, currency1), currency1)}
                        </div>
                      </div>

                      {/* Stake 2 */}
                      <div className="rounded-md border border-border/50 bg-secondary/30 p-2">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-card-foreground">Cuota 2</span>
                          </div>
                          <Select value={currency2} onValueChange={(v) => setCurrency2(v as Currency)}>
                            <SelectTrigger className="h-6 w-20 bg-background/50 text-[10px]">
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
                        <div className="text-right text-lg font-black text-primary">
                          {formatCurrency(convertCurrency(result.stake2, baseCurrency, currency2), currency2)}
                        </div>
                      </div>

                      {/* Profit */}
                      <div className="rounded-md border-2 border-primary/30 bg-primary/10 p-2">
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-card-foreground">Ganancia</span>
                          </div>
                          <Select value={currencyProfit} onValueChange={(v) => setCurrencyProfit(v as Currency)}>
                            <SelectTrigger className="h-6 w-20 bg-background/50 text-[10px]">
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
                        <div className={cn("text-right text-lg font-black", result.profit >= 0 ? "text-primary" : "text-destructive")}>
                          {result.profit >= 0 ? "+" : ""}
                          {formatCurrency(convertCurrency(result.profit, baseCurrency, currencyProfit), currencyProfit)}
                        </div>
                      </div>

                      {/* Save Button */}
                      <Button
                        onClick={handleSaveProfit}
                        disabled={!result.isSurebet}
                        className={cn(
                          "mt-auto gap-1.5 transition-all",
                          saveSuccess && "bg-emerald-600 hover:bg-emerald-600"
                        )}
                      >
                        <Save className="h-4 w-4" />
                        {saveSuccess ? "Guardado!" : "Guardar Ganancia"}
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="flex flex-1 items-center justify-center border-dashed border-border/50 bg-card/50">
                  <CardContent className="py-6 text-center">
                    <Calculator className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                    <p className="text-xs font-medium text-muted-foreground">Ingresa las cuotas para calcular</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-0 flex-1">
          <ProfitHistory
            records={profitRecords}
            onDelete={handleDeleteRecord}
            onClearAll={handleClearAll}
            exchangeRates={exchangeRates}
          />
        </TabsContent>
      </Tabs>

      {/* Contact Footer */}
      <div className="mt-4 rounded-xl border border-border/50 bg-card p-3">
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Carlos Agudelo</span>
            <span className="mx-2">|</span>
            Proveedor de recargas y retiros para casas con metodo
            <span className="ml-1 font-semibold text-primary">icash.one</span>
          </div>
          <a
            href="https://wa.me/573113317247"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground/70">
          Contactame tambien para mejoras o sugerencias de la calculadora
        </p>
      </div>
    </div>
  )
}
