import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CandlestickChart,
  CheckCircle2,
  Clock,
  GitBranch,
  Layers,
  ShieldCheck,
  TrendingUp,
  Wallet,
  X,
  Zap,
} from 'lucide-react';

type SymbolCode = 'BTC' | 'ETH' | 'SOL' | 'TON';
type Timeframe = '1H' | '4H' | '1D' | '1W';
type ChartMode = 'candle' | 'area';
type OrderSide = 'buy' | 'sell';
type OrderType = 'limit' | 'market';
type FeedTab = 'trades' | 'orders';

interface MarketTicker {
  symbol: SymbolCode;
  name: string;
  price: number;
  prevPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: string;
  decimals: number;
  tickSize: number;
  flash: 'up' | 'down' | null;
}

interface CandlePoint {
  id: number;
  label: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
  depthPct: number;
}

interface TradeEntry {
  id: string;
  symbol: SymbolCode;
  side: OrderSide;
  price: number;
  amount: number;
  time: string;
  isUser?: boolean;
}

interface OpenOrder {
  id: string;
  symbol: SymbolCode;
  side: OrderSide;
  price: number;
  amount: number;
  total: number;
  time: string;
}

const INITIAL_TICKERS: Record<SymbolCode, MarketTicker> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 94820.4,
    prevPrice: 94820.4,
    change24h: 3.42,
    high24h: 95640.0,
    low24h: 91380.5,
    volume24h: '$4.82B',
    decimals: 2,
    tickSize: 12.5,
    flash: null,
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3428.75,
    prevPrice: 3428.75,
    change24h: 2.18,
    high24h: 3495.2,
    low24h: 3310.4,
    volume24h: '$2.14B',
    decimals: 2,
    tickSize: 1.4,
    flash: null,
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    price: 218.64,
    prevPrice: 218.64,
    change24h: 6.85,
    high24h: 224.1,
    low24h: 201.35,
    volume24h: '$1.39B',
    decimals: 2,
    tickSize: 0.18,
    flash: null,
  },
  TON: {
    symbol: 'TON',
    name: 'Toncoin',
    price: 6.482,
    prevPrice: 6.482,
    change24h: -1.24,
    high24h: 6.71,
    low24h: 6.29,
    volume24h: '$412M',
    decimals: 3,
    tickSize: 0.008,
    flash: null,
  },
};

const SYMBOLS: SymbolCode[] = ['BTC', 'ETH', 'SOL', 'TON'];
const TIMEFRAMES: Timeframe[] = ['1H', '4H', '1D', '1W'];

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function generateCandles(
  symbol: SymbolCode,
  timeframe: Timeframe,
  anchorPrice: number
): CandlePoint[] {
  const count = 42;
  const tfMultiplier =
    timeframe === '1H' ? 0.003 : timeframe === '4H' ? 0.007 : timeframe === '1D' ? 0.014 : 0.028;
  const symbolSeed = symbol.charCodeAt(0) * 17 + timeframe.charCodeAt(0) * 31;
  const points: CandlePoint[] = [];

  let cursor = anchorPrice * (1 - tfMultiplier * 4.5);
  const now = Date.now();
  const stepMs =
    timeframe === '1H'
      ? 60 * 60 * 1000
      : timeframe === '4H'
      ? 4 * 60 * 60 * 1000
      : timeframe === '1D'
      ? 24 * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < count; i++) {
    const n1 = seededNoise(symbolSeed + i * 3.1);
    const n2 = seededNoise(symbolSeed + i * 7.7);
    const n3 = seededNoise(symbolSeed + i * 11.3);
    const drift = (n1 - 0.46) * anchorPrice * tfMultiplier;
    const open = cursor;
    const close = i === count - 1 ? anchorPrice : Math.max(anchorPrice * 0.5, open + drift);
    const wickUp = n2 * anchorPrice * tfMultiplier * 0.55;
    const wickDown = n3 * anchorPrice * tfMultiplier * 0.55;
    const high = Math.max(open, close) + wickUp;
    const low = Math.min(open, close) - wickDown;
    const volume = Math.round((0.35 + n2 * 1.45) * 1000) / 10;

    const ts = new Date(now - (count - 1 - i) * stepMs);
    const label =
      timeframe === '1H' || timeframe === '4H'
        ? ts.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' })
        : ts.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

    points.push({ id: i, label, open, high, low, close, volume });
    cursor = close;
  }

  return points;
}

function formatPrice(value: number, decimals: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function nowTimeString(): string {
  return new Date().toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function App() {
  const [tickers, setTickers] = useState<Record<SymbolCode, MarketTicker>>(INITIAL_TICKERS);
  const [activeSymbol, setActiveSymbol] = useState<SymbolCode>('BTC');
  const [timeframe, setTimeframe] = useState<Timeframe>('1H');
  const [chartMode, setChartMode] = useState<ChartMode>('candle');
  const [candles, setCandles] = useState<CandlePoint[]>(() =>
    generateCandles('BTC', '1H', INITIAL_TICKERS.BTC.price)
  );
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Order book & feed state
  const [orderSide, setOrderSide] = useState<OrderSide>('buy');
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [limitPriceInput, setLimitPriceInput] = useState<string>(
    INITIAL_TICKERS.BTC.price.toFixed(2)
  );
  const [amountInput, setAmountInput] = useState<string>('0.25');
  const [feedTab, setFeedTab] = useState<FeedTab>('trades');
  const [usdtBalance, setUsdtBalance] = useState<number>(125400.0);
  const [holdings, setHoldings] = useState<Record<SymbolCode, number>>({
    BTC: 1.482,
    ETH: 12.5,
    SOL: 84.0,
    TON: 1250.0,
  });
  const [recentTrades, setRecentTrades] = useState<TradeEntry[]>(() => [
    { id: 't-1', symbol: 'BTC', side: 'buy', price: 94821.5, amount: 0.412, time: '13:47:52' },
    { id: 't-2', symbol: 'BTC', side: 'sell', price: 94816.2, amount: 0.185, time: '13:47:48' },
    { id: 't-3', symbol: 'BTC', side: 'buy', price: 94828.0, amount: 1.024, time: '13:47:41' },
    { id: 't-4', symbol: 'BTC', side: 'sell', price: 94809.4, amount: 0.64, time: '13:47:34' },
    { id: 't-5', symbol: 'BTC', side: 'buy', price: 94815.0, amount: 0.29, time: '13:47:25' },
  ]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [orderNotice, setOrderNotice] = useState<string | null>(null);
  const [bookJitter, setBookJitter] = useState<number>(0);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const activeTicker = tickers[activeSymbol];

  // Regenerate chart base when symbol or timeframe changes
  useEffect(() => {
    const t = tickers[activeSymbol];
    setCandles(generateCandles(activeSymbol, timeframe, t.price));
    setLimitPriceInput(t.price.toFixed(t.decimals));
    setHoverIndex(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSymbol, timeframe]);

  // Live simulated market price ticks across all 4 tickers
  useEffect(() => {
    const interval = window.setInterval(() => {
      setTickers((prev) => {
        const next = { ...prev };
        for (const sym of SYMBOLS) {
          const item = prev[sym];
          const delta = (Math.random() - 0.49) * item.tickSize * 2.2;
          const newPrice = Math.max(
            item.tickSize * 10,
            Number((item.price + delta).toFixed(item.decimals))
          );
          const direction: 'up' | 'down' | null =
            newPrice > item.price ? 'up' : newPrice < item.price ? 'down' : null;
          next[sym] = {
            ...item,
            prevPrice: item.price,
            price: newPrice,
            high24h: Math.max(item.high24h, newPrice),
            low24h: Math.min(item.low24h, newPrice),
            change24h: Number((item.change24h + (delta / item.price) * 28).toFixed(2)),
            flash: direction,
          };
        }
        return next;
      });
      setBookJitter((n) => n + 1);
    }, 1100);

    return () => window.clearInterval(interval);
  }, []);

  // Sync live candle close & organic market tape with activeTicker updates
  useEffect(() => {
    setCandles((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updatedLast: CandlePoint = {
        ...last,
        close: activeTicker.price,
        high: Math.max(last.high, activeTicker.price),
        low: Math.min(last.low, activeTicker.price),
        volume: Number((last.volume + Math.random() * 4.5).toFixed(1)),
      };
      return [...prev.slice(0, -1), updatedLast];
    });

    if (activeTicker.flash) {
      const autoTrade: TradeEntry = {
        id: `mkt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        symbol: activeSymbol,
        side: activeTicker.flash === 'up' ? 'buy' : 'sell',
        price: activeTicker.price,
        amount: Number((0.05 + Math.random() * 1.4).toFixed(3)),
        time: nowTimeString(),
      };
      setRecentTrades((prev) => [autoTrade, ...prev].slice(0, 18));
    }
  }, [activeTicker.price, activeTicker.flash, activeSymbol]);

  // Auto-fill matching open limit orders if market crosses them
  useEffect(() => {
    setOpenOrders((prevOrders) => {
      if (prevOrders.length === 0) return prevOrders;
      const remaining: OpenOrder[] = [];
      for (const ord of prevOrders) {
        const marketPrice = tickers[ord.symbol].price;
        const filled =
          (ord.side === 'buy' && marketPrice <= ord.price) ||
          (ord.side === 'sell' && marketPrice >= ord.price);
        if (filled) {
          if (ord.side === 'buy') {
            setHoldings((h) => ({ ...h, [ord.symbol]: h[ord.symbol] + ord.amount }));
          } else {
            setUsdtBalance((b) => b + ord.total);
          }
          setRecentTrades((t) => [
            {
              id: `fill-${ord.id}`,
              symbol: ord.symbol,
              side: ord.side,
              price: ord.price,
              amount: ord.amount,
              time: nowTimeString(),
              isUser: true,
            },
            ...t,
          ].slice(0, 18));
          setOrderNotice(
            `Limit ${ord.side.toUpperCase()} filled: ${ord.amount} ${ord.symbol} @ $${formatPrice(
              ord.price,
              tickers[ord.symbol].decimals
            )}`
          );
        } else {
          remaining.push(ord);
        }
      }
      return remaining;
    });
  }, [tickers]);

  // Clear toast notice
  useEffect(() => {
    if (!orderNotice) return;
    const t = window.setTimeout(() => setOrderNotice(null), 3200);
    return () => window.clearTimeout(t);
  }, [orderNotice]);

  // Dynamic Order Book (7 asks + 7 bids)
  const orderBook = useMemo(() => {
    const mid = activeTicker.price;
    const step = activeTicker.tickSize;
    const asksRaw: { price: number; size: number }[] = [];
    const bidsRaw: { price: number; size: number }[] = [];

    for (let i = 7; i >= 1; i--) {
      const jitter = 0.65 + seededNoise(bookJitter * 1.3 + i * 9) * 1.35;
      const baseSize = activeSymbol === 'BTC' ? 0.65 : activeSymbol === 'ETH' ? 4.8 : 42;
      asksRaw.push({
        price: Number((mid + i * step).toFixed(activeTicker.decimals)),
        size: Number((baseSize * jitter).toFixed(3)),
      });
    }

    for (let i = 1; i <= 7; i++) {
      const jitter = 0.65 + seededNoise(bookJitter * 1.7 + i * 13) * 1.35;
      const baseSize = activeSymbol === 'BTC' ? 0.65 : activeSymbol === 'ETH' ? 4.8 : 42;
      bidsRaw.push({
        price: Number(Math.max(step, mid - i * step).toFixed(activeTicker.decimals)),
        size: Number((baseSize * jitter).toFixed(3)),
      });
    }

    let askCum = 0;
    const asksReversed = [...asksRaw].reverse().map((lvl) => {
      askCum += lvl.size;
      return { ...lvl, total: askCum };
    });
    const maxAskTotal = askCum || 1;
    const asks: OrderBookLevel[] = asksReversed
      .reverse()
      .map((lvl) => ({ ...lvl, depthPct: Math.min(100, (lvl.total / maxAskTotal) * 100) }));

    let bidCum = 0;
    const bidsWithCum = bidsRaw.map((lvl) => {
      bidCum += lvl.size;
      return { ...lvl, total: bidCum };
    });
    const maxBidTotal = bidCum || 1;
    const bids: OrderBookLevel[] = bidsWithCum.map((lvl) => ({
      ...lvl,
      depthPct: Math.min(100, (lvl.total / maxBidTotal) * 100),
    }));

    const bestAsk = asks[asks.length - 1]?.price ?? mid;
    const bestBid = bids[0]?.price ?? mid;
    const spread = Math.max(0, bestAsk - bestBid);
    const spreadPct = mid > 0 ? (spread / mid) * 100 : 0;

    return { asks, bids, spread, spreadPct };
  }, [activeTicker.price, activeTicker.tickSize, activeTicker.decimals, activeSymbol, bookJitter]);

  // SVG Chart Metrics
  const chartMetrics = useMemo(() => {
    const width = 820;
    const height = 340;
    const padLeft = 14;
    const padRight = 76;
    const padTop = 18;
    const padBottom = 34;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const minVal = Math.min(...candles.map((c) => c.low));
    const maxVal = Math.max(...candles.map((c) => c.high));
    const range = Math.max(maxVal - minVal, activeTicker.tickSize * 4);
    const paddedMin = minVal - range * 0.08;
    const paddedMax = maxVal + range * 0.08;
    const totalRange = paddedMax - paddedMin;

    const maxVol = Math.max(...candles.map((c) => c.volume), 1);

    const toY = (price: number) =>
      padTop + plotH - ((price - paddedMin) / totalRange) * plotH;
    const toX = (idx: number) =>
      padLeft + ((idx + 0.5) / Math.max(1, candles.length)) * plotW;

    const areaLinePath = candles
      .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${toX(idx).toFixed(2)} ${toY(c.close).toFixed(2)}`)
      .join(' ');

    const areaFillPath =
      candles.length > 0
        ? `${areaLinePath} L ${toX(candles.length - 1).toFixed(2)} ${(padTop + plotH).toFixed(
            2
          )} L ${toX(0).toFixed(2)} ${(padTop + plotH).toFixed(2)} Z`
        : '';

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => {
      const price = paddedMax - t * totalRange;
      return { y: padTop + t * plotH, price };
    });

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      plotW,
      plotH,
      maxVol,
      toY,
      toX,
      areaLinePath,
      areaFillPath,
      yTicks,
    };
  }, [candles, activeTicker.tickSize]);

  const hoveredCandle =
    hoverIndex !== null && candles[hoverIndex]
      ? candles[hoverIndex]
      : candles[candles.length - 1] ?? null;

  const handleChartMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || candles.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * chartMetrics.width;
    const clampedX = Math.max(
      chartMetrics.padLeft,
      Math.min(chartMetrics.padLeft + chartMetrics.plotW, relX)
    );
    const ratio = (clampedX - chartMetrics.padLeft) / chartMetrics.plotW;
    const idx = Math.min(candles.length - 1, Math.max(0, Math.floor(ratio * candles.length)));
    setHoverIndex(idx);
  };

  const parsedPrice =
    orderType === 'market' ? activeTicker.price : Math.max(0, Number(limitPriceInput) || 0);
  const parsedAmount = Math.max(0, Number(amountInput) || 0);
  const estimatedTotal = parsedPrice * parsedAmount;
  const estimatedFee = estimatedTotal * 0.0008;

  const applySizePercent = (pct: number) => {
    const px = orderType === 'market' ? activeTicker.price : Number(limitPriceInput) || activeTicker.price;
    if (px <= 0) return;
    if (orderSide === 'buy') {
      const maxCoin = (usdtBalance * pct) / px;
      setAmountInput(maxCoin.toFixed(4));
    } else {
      const maxCoin = holdings[activeSymbol] * pct;
      setAmountInput(maxCoin.toFixed(4));
    }
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0 || parsedPrice <= 0) {
      setOrderNotice('Enter a valid price and quantity above 0.');
      return;
    }

    if (orderSide === 'buy' && estimatedTotal > usdtBalance) {
      setOrderNotice('Insufficient USDT available balance.');
      return;
    }
    if (orderSide === 'sell' && parsedAmount > holdings[activeSymbol]) {
      setOrderNotice(`Insufficient ${activeSymbol} balance.`);
      return;
    }

    const executesImmediately =
      orderType === 'market' ||
      (orderSide === 'buy' && parsedPrice >= activeTicker.price) ||
      (orderSide === 'sell' && parsedPrice <= activeTicker.price);

    if (executesImmediately) {
      const execPrice = orderType === 'market' ? activeTicker.price : parsedPrice;
      const totalValue = execPrice * parsedAmount;

      if (orderSide === 'buy') {
        setUsdtBalance((b) => Math.max(0, b - totalValue));
        setHoldings((h) => ({ ...h, [activeSymbol]: h[activeSymbol] + parsedAmount }));
      } else {
        setHoldings((h) => ({ ...h, [activeSymbol]: Math.max(0, h[activeSymbol] - parsedAmount) }));
        setUsdtBalance((b) => b + totalValue);
      }

      const trade: TradeEntry = {
        id: `usr-${Date.now()}`,
        symbol: activeSymbol,
        side: orderSide,
        price: execPrice,
        amount: parsedAmount,
        time: nowTimeString(),
        isUser: true,
      };
      setRecentTrades((prev) => [trade, ...prev].slice(0, 18));
      setFeedTab('trades');
      setOrderNotice(
        `Executed ${orderSide.toUpperCase()} ${parsedAmount.toFixed(4)} ${activeSymbol} @ $${formatPrice(
          execPrice,
          activeTicker.decimals
        )}`
      );
    } else {
      if (orderSide === 'buy') {
        setUsdtBalance((b) => Math.max(0, b - estimatedTotal));
      } else {
        setHoldings((h) => ({ ...h, [activeSymbol]: Math.max(0, h[activeSymbol] - parsedAmount) }));
      }
      const newOrder: OpenOrder = {
        id: `ord-${Date.now()}`,
        symbol: activeSymbol,
        side: orderSide,
        price: parsedPrice,
        amount: parsedAmount,
        total: estimatedTotal,
        time: nowTimeString(),
      };
      setOpenOrders((prev) => [newOrder, ...prev]);
      setFeedTab('orders');
      setOrderNotice(
        `Limit ${orderSide.toUpperCase()} placed: ${parsedAmount.toFixed(4)} ${activeSymbol} @ $${formatPrice(
          parsedPrice,
          activeTicker.decimals
        )}`
      );
    }
  };

  const cancelOpenOrder = (ord: OpenOrder) => {
    setOpenOrders((prev) => prev.filter((item) => item.id !== ord.id));
    if (ord.side === 'buy') {
      setUsdtBalance((b) => b + ord.total);
    } else {
      setHoldings((h) => ({ ...h, [ord.symbol]: h[ord.symbol] + ord.amount }));
    }
    setOrderNotice(`Cancelled ${ord.side.toUpperCase()} limit order for ${ord.symbol}.`);
  };

  const isPositive24h = activeTicker.change24h >= 0;

  return (
    <div className="relative min-h-screen w-full bg-[#060913] text-slate-100 overflow-x-hidden">
      {/* Subtle Ambient Emerald & Rose Aurora Mesh */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 -left-32 h-[34rem] w-[34rem] rounded-full bg-emerald-500/12 blur-[140px] animate-float-slow"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-40 -right-28 h-[34rem] w-[34rem] rounded-full bg-rose-500/10 blur-[140px] animate-float-reverse"
      />
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 bg-cyber-grid opacity-30" />

      <div className="relative z-10 mx-auto max-w-[1480px] px-4 py-4 sm:px-6">
        {/* Top Institutional Header + Ticker Strip + Floating Branch Badge */}
        <header className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/15 shadow-[0_0_25px_-6px_rgba(16,185,129,0.55)]">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold tracking-[0.18em] text-white uppercase">
                    AetherQuant
                  </span>
                  <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                    PRO DESK
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Low-Latency Institutional Spot Engine</p>
              </div>
            </div>

            {/* Mobile Branch Badge */}
            <div className="flex lg:hidden items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 backdrop-blur-xl">
              <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
              <span className="font-mono text-[11px] font-semibold text-white">
                BRANCH: feature/crypto-terminal
              </span>
            </div>
          </div>

          {/* Live Ticker Strip: BTC, ETH, SOL, TON */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center lg:gap-2.5">
            {SYMBOLS.map((sym) => {
              const t = tickers[sym];
              const isSelected = activeSymbol === sym;
              const up = t.change24h >= 0;
              const flashColor =
                t.flash === 'up'
                  ? 'text-emerald-300'
                  : t.flash === 'down'
                  ? 'text-rose-300'
                  : 'text-white';
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => setActiveSymbol(sym)}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-400/45 bg-emerald-500/10 shadow-[0_0_24px_-10px_rgba(16,185,129,0.5)]'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{sym}</span>
                      <span className="text-[10px] text-slate-500">/USDT</span>
                    </div>
                    <div
                      className={`mt-0.5 font-mono text-xs font-semibold tabular-nums transition-colors duration-300 ${flashColor}`}
                    >
                      ${formatPrice(t.price, t.decimals)}
                    </div>
                  </div>
                  <span
                    className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums ${
                      up
                        ? 'bg-emerald-500/15 text-emerald-300'
                        : 'bg-rose-500/15 text-rose-300'
                    }`}
                  >
                    {up ? '+' : ''}
                    {t.change24h.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop Floating Branch Badge at Top-Right */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/12 px-3.5 py-1.5 backdrop-blur-xl shadow-[0_0_25px_-8px_rgba(16,185,129,0.5)]">
            <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-xs font-semibold tracking-wide text-white">
              BRANCH: feature/crypto-terminal
            </span>
          </div>
        </header>

        {/* Order Execution Toast */}
        {orderNotice && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-400/35 bg-emerald-500/12 px-4 py-2.5 text-xs text-emerald-200 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{orderNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setOrderNotice(null)}
              className="text-emerald-300/80 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main 12-Col Institutional Terminal Grid */}
        <main className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
          {/* Left / Center: Pair Summary + Interactive SVG Candlestick/Area Chart + Recent Trades / Open Orders (8 cols) */}
          <div className="flex flex-col gap-4 xl:col-span-8">
            {/* Active Pair KPI Header + Chart Card */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 backdrop-blur-xl">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-xl font-bold tracking-tight text-white">
                        {activeSymbol}/USDT
                      </h1>
                      <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-slate-300">
                        {activeTicker.name}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={`font-mono text-2xl font-bold tabular-nums ${
                          activeTicker.flash === 'up'
                            ? 'text-emerald-400'
                            : activeTicker.flash === 'down'
                            ? 'text-rose-400'
                            : 'text-white'
                        }`}
                      >
                        ${formatPrice(activeTicker.price, activeTicker.decimals)}
                      </span>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${
                          isPositive24h
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {isPositive24h ? (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {isPositive24h ? '+' : ''}
                        {activeTicker.change24h.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-l border-white/10 pl-4 text-xs">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">
                        24h High
                      </div>
                      <div className="mt-0.5 font-mono font-semibold tabular-nums text-slate-200">
                        ${formatPrice(activeTicker.high24h, activeTicker.decimals)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">
                        24h Low
                      </div>
                      <div className="mt-0.5 font-mono font-semibold tabular-nums text-slate-200">
                        ${formatPrice(activeTicker.low24h, activeTicker.decimals)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-slate-400">
                        24h Vol
                      </div>
                      <div className="mt-0.5 font-mono font-semibold tabular-nums text-emerald-300">
                        {activeTicker.volume24h}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeframe & Chart Type Controls */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center rounded-xl border border-white/10 bg-[#060913]/70 p-1">
                    {TIMEFRAMES.map((tf) => (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => setTimeframe(tf)}
                        className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition cursor-pointer ${
                          timeframe === tf
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/35'
                            : 'text-slate-400 hover:text-white border border-transparent'
                        }`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center rounded-xl border border-white/10 bg-[#060913]/70 p-1">
                    <button
                      type="button"
                      onClick={() => setChartMode('candle')}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                        chartMode === 'candle'
                          ? 'bg-white/[0.12] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Candlestick Chart"
                    >
                      <CandlestickChart className="h-3.5 w-3.5" />
                      <span>Candles</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMode('area')}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                        chartMode === 'area'
                          ? 'bg-white/[0.12] text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      title="Area Chart"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      <span>Area</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* OHLCV Crosshair Readout Strip */}
              {hoveredCandle && (
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-white/10 bg-[#060913]/65 px-3.5 py-2 font-mono text-[11px] tabular-nums">
                  <span className="text-slate-400">{hoveredCandle.label}</span>
                  <span>
                    <span className="text-slate-500">O </span>
                    <span className="text-slate-200">
                      {formatPrice(hoveredCandle.open, activeTicker.decimals)}
                    </span>
                  </span>
                  <span>
                    <span className="text-slate-500">H </span>
                    <span className="text-emerald-300">
                      {formatPrice(hoveredCandle.high, activeTicker.decimals)}
                    </span>
                  </span>
                  <span>
                    <span className="text-slate-500">L </span>
                    <span className="text-rose-300">
                      {formatPrice(hoveredCandle.low, activeTicker.decimals)}
                    </span>
                  </span>
                  <span>
                    <span className="text-slate-500">C </span>
                    <span
                      className={
                        hoveredCandle.close >= hoveredCandle.open
                          ? 'text-emerald-300 font-semibold'
                          : 'text-rose-300 font-semibold'
                      }
                    >
                      {formatPrice(hoveredCandle.close, activeTicker.decimals)}
                    </span>
                  </span>
                  <span>
                    <span className="text-slate-500">VOL </span>
                    <span className="text-slate-300">{hoveredCandle.volume.toFixed(1)}K</span>
                  </span>
                </div>
              )}

              {/* Interactive SVG Price Chart */}
              <div className="relative mt-3 w-full overflow-hidden rounded-xl border border-white/10 bg-[#050811]/90 p-2">
                <svg
                  ref={svgRef}
                  viewBox={`0 0 ${chartMetrics.width} ${chartMetrics.height}`}
                  className="h-[310px] w-full select-none sm:h-[350px]"
                  onMouseMove={handleChartMouseMove}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <defs>
                    <linearGradient id="areaEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid & Right Y-Axis Price Labels */}
                  {chartMetrics.yTicks.map((tick, i) => (
                    <g key={i}>
                      <line
                        x1={chartMetrics.padLeft}
                        y1={tick.y}
                        x2={chartMetrics.padLeft + chartMetrics.plotW}
                        y2={tick.y}
                        stroke="rgba(255,255,255,0.06)"
                        strokeDasharray="3 4"
                      />
                      <text
                        x={chartMetrics.padLeft + chartMetrics.plotW + 8}
                        y={tick.y + 4}
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {formatPrice(tick.price, activeTicker.decimals)}
                      </text>
                    </g>
                  ))}

                  {/* Volume Histogram along bottom */}
                  {candles.map((c, idx) => {
                    const barW = Math.max(4, (chartMetrics.plotW / candles.length) * 0.56);
                    const x = chartMetrics.toX(idx) - barW / 2;
                    const barH = (c.volume / chartMetrics.maxVol) * 44;
                    const y = chartMetrics.padTop + chartMetrics.plotH - barH;
                    const isBull = c.close >= c.open;
                    return (
                      <rect
                        key={`vol-${c.id}`}
                        x={x}
                        y={y}
                        width={barW}
                        height={barH}
                        rx={1.5}
                        fill={isBull ? 'rgba(16, 185, 129, 0.20)' : 'rgba(244, 63, 94, 0.20)'}
                      />
                    );
                  })}

                  {/* Candles or Area Mode */}
                  {chartMode === 'area' ? (
                    <>
                      <path d={chartMetrics.areaFillPath} fill="url(#areaEmerald)" />
                      <path
                        d={chartMetrics.areaLinePath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.4"
                        strokeLinejoin="round"
                      />
                    </>
                  ) : (
                    candles.map((c, idx) => {
                      const cx = chartMetrics.toX(idx);
                      const bodyW = Math.max(5, (chartMetrics.plotW / candles.length) * 0.58);
                      const yHigh = chartMetrics.toY(c.high);
                      const yLow = chartMetrics.toY(c.low);
                      const yOpen = chartMetrics.toY(c.open);
                      const yClose = chartMetrics.toY(c.close);
                      const isBull = c.close >= c.open;
                      const color = isBull ? '#10b981' : '#f43f5e';
                      const rectY = Math.min(yOpen, yClose);
                      const rectH = Math.max(2.5, Math.abs(yClose - yOpen));
                      const isHovered = hoverIndex === idx;

                      return (
                        <g key={c.id}>
                          <line
                            x1={cx}
                            y1={yHigh}
                            x2={cx}
                            y2={yLow}
                            stroke={color}
                            strokeWidth={isHovered ? 2 : 1.4}
                          />
                          <rect
                            x={cx - bodyW / 2}
                            y={rectY}
                            width={bodyW}
                            height={rectH}
                            rx={1.5}
                            fill={color}
                            opacity={isHovered ? 1 : 0.88}
                          />
                        </g>
                      );
                    })
                  )}

                  {/* Live Current Price Line */}
                  <line
                    x1={chartMetrics.padLeft}
                    y1={chartMetrics.toY(activeTicker.price)}
                    x2={chartMetrics.padLeft + chartMetrics.plotW}
                    y2={chartMetrics.toY(activeTicker.price)}
                    stroke="#10b981"
                    strokeOpacity="0.6"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={chartMetrics.padLeft + chartMetrics.plotW + 4}
                    y={chartMetrics.toY(activeTicker.price) - 9}
                    width={68}
                    height={18}
                    rx={4}
                    fill="#10b981"
                  />
                  <text
                    x={chartMetrics.padLeft + chartMetrics.plotW + 8}
                    y={chartMetrics.toY(activeTicker.price) + 3.5}
                    fill="#04120c"
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {formatPrice(activeTicker.price, activeTicker.decimals)}
                  </text>

                  {/* Interactive Hover Crosshair */}
                  {hoverIndex !== null && candles[hoverIndex] && (
                    <g>
                      <line
                        x1={chartMetrics.toX(hoverIndex)}
                        y1={chartMetrics.padTop}
                        x2={chartMetrics.toX(hoverIndex)}
                        y2={chartMetrics.padTop + chartMetrics.plotH}
                        stroke="rgba(226,232,240,0.35)"
                        strokeDasharray="3 3"
                      />
                      <line
                        x1={chartMetrics.padLeft}
                        y1={chartMetrics.toY(candles[hoverIndex].close)}
                        x2={chartMetrics.padLeft + chartMetrics.plotW}
                        y2={chartMetrics.toY(candles[hoverIndex].close)}
                        stroke="rgba(226,232,240,0.35)"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={chartMetrics.toX(hoverIndex)}
                        cy={chartMetrics.toY(candles[hoverIndex].close)}
                        r={4.5}
                        fill="#060913"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    </g>
                  )}

                  {/* X-axis sparse timestamps */}
                  {candles
                    .filter((_, i) => i % 7 === 0 || i === candles.length - 1)
                    .map((c) => (
                      <text
                        key={`x-${c.id}`}
                        x={chartMetrics.toX(c.id)}
                        y={chartMetrics.height - 10}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="10"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {c.label}
                      </text>
                    ))}
                </svg>
              </div>
            </section>

            {/* Recent Trades & Open Orders Feed */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFeedTab('trades')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      feedTab === 'trades'
                        ? 'bg-white/[0.1] text-white border border-white/15'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Recent Trades</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedTab('orders')}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      feedTab === 'orders'
                        ? 'bg-white/[0.1] text-white border border-white/15'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5 text-rose-400" />
                    <span>Open Orders ({openOrders.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 font-mono text-xs tabular-nums text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-slate-400">USDT:</span>
                    <span className="font-semibold text-white">
                      ${usdtBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </span>
                  <span>
                    <span className="text-slate-400">{activeSymbol}:</span>{' '}
                    <span className="font-semibold text-emerald-300">
                      {holdings[activeSymbol].toFixed(4)}
                    </span>
                  </span>
                </div>
              </div>

              {feedTab === 'trades' ? (
                <div className="mt-3 max-h-56 overflow-y-auto pr-1">
                  <table className="w-full text-left font-mono text-xs tabular-nums">
                    <thead className="text-[10px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="pb-2">Pair</th>
                        <th className="pb-2">Side</th>
                        <th className="pb-2 text-right">Price (USDT)</th>
                        <th className="pb-2 text-right">Size</th>
                        <th className="pb-2 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {recentTrades.map((trade) => (
                        <tr
                          key={trade.id}
                          className={
                            trade.isUser
                              ? 'bg-emerald-500/10 text-white'
                              : 'hover:bg-white/[0.03] text-slate-300'
                          }
                        >
                          <td className="py-1.5 font-semibold">
                            {trade.symbol}/USDT
                            {trade.isUser && (
                              <span className="ml-1.5 rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] text-emerald-300">
                                YOU
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-1.5 font-semibold uppercase ${
                              trade.side === 'buy' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {trade.side}
                          </td>
                          <td className="py-1.5 text-right">
                            ${formatPrice(trade.price, tickers[trade.symbol].decimals)}
                          </td>
                          <td className="py-1.5 text-right">{trade.amount.toFixed(4)}</td>
                          <td className="py-1.5 text-right text-slate-400">{trade.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : openOrders.length === 0 ? (
                <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 py-8 text-center">
                  <Clock className="h-5 w-5 text-slate-500" />
                  <p className="mt-2 text-xs text-slate-400">
                    No active resting limit orders. Place a limit order away from spot price to queue it here.
                  </p>
                </div>
              ) : (
                <div className="mt-3 max-h-56 overflow-y-auto space-y-2">
                  {openOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-[#060913]/60 px-3 py-2 font-mono text-xs tabular-nums"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            ord.side === 'buy'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {ord.side}
                        </span>
                        <span className="font-semibold text-white">{ord.symbol}/USDT</span>
                        <span className="text-slate-300">
                          {ord.amount.toFixed(4)} @ ${formatPrice(ord.price, tickers[ord.symbol].decimals)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => cancelOpenOrder(ord)}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Live Order Book + Buy/Sell Order Execution Ticket (4 cols) */}
          <div className="flex flex-col gap-4 xl:col-span-4">
            {/* Live Animated Order Book */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Order Book
                  </h2>
                </div>
                <span className="font-mono text-[10px] text-slate-400">Click level to fill</span>
              </div>

              <div className="mt-2.5 grid grid-cols-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                <span>Price (USDT)</span>
                <span className="text-right">Size ({activeSymbol})</span>
                <span className="text-right">Total</span>
              </div>

              {/* Asks (Sells) */}
              <div className="mt-1.5 space-y-0.5">
                {orderBook.asks.map((lvl, idx) => (
                  <button
                    key={`ask-${idx}`}
                    type="button"
                    onClick={() => {
                      setOrderType('limit');
                      setLimitPriceInput(lvl.price.toFixed(activeTicker.decimals));
                    }}
                    className="relative grid w-full grid-cols-3 items-center rounded px-1.5 py-1 font-mono text-xs tabular-nums transition hover:bg-white/[0.05] cursor-pointer"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 right-0 rounded bg-rose-500/14 transition-all duration-500"
                      style={{ width: `${lvl.depthPct}%` }}
                    />
                    <span className="relative text-left font-medium text-rose-400">
                      {formatPrice(lvl.price, activeTicker.decimals)}
                    </span>
                    <span className="relative text-right text-slate-200">{lvl.size.toFixed(3)}</span>
                    <span className="relative text-right text-slate-400">{lvl.total.toFixed(2)}</span>
                  </button>
                ))}
              </div>

              {/* Spread Strip */}
              <div className="my-2 flex items-center justify-between rounded-lg border border-white/10 bg-[#060913]/80 px-3 py-1.5 font-mono text-xs tabular-nums">
                <span className="font-semibold text-white">
                  ${formatPrice(activeTicker.price, activeTicker.decimals)}
                </span>
                <span className="text-[11px] text-slate-400">
                  Spread ${formatPrice(orderBook.spread, activeTicker.decimals)} (
                  {orderBook.spreadPct.toFixed(3)}%)
                </span>
              </div>

              {/* Bids (Buys) */}
              <div className="space-y-0.5">
                {orderBook.bids.map((lvl, idx) => (
                  <button
                    key={`bid-${idx}`}
                    type="button"
                    onClick={() => {
                      setOrderType('limit');
                      setLimitPriceInput(lvl.price.toFixed(activeTicker.decimals));
                    }}
                    className="relative grid w-full grid-cols-3 items-center rounded px-1.5 py-1 font-mono text-xs tabular-nums transition hover:bg-white/[0.05] cursor-pointer"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 right-0 rounded bg-emerald-500/14 transition-all duration-500"
                      style={{ width: `${lvl.depthPct}%` }}
                    />
                    <span className="relative text-left font-medium text-emerald-400">
                      {formatPrice(lvl.price, activeTicker.decimals)}
                    </span>
                    <span className="relative text-right text-slate-200">{lvl.size.toFixed(3)}</span>
                    <span className="relative text-right text-slate-400">{lvl.total.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Buy / Sell Execution Panel */}
            <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-white/10 bg-[#060913]/75 p-1">
                <button
                  type="button"
                  onClick={() => setOrderSide('buy')}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    orderSide === 'buy'
                      ? 'bg-emerald-500 text-slate-950 shadow-[0_0_24px_-4px_rgba(16,185,129,0.7)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Buy {activeSymbol}
                </button>
                <button
                  type="button"
                  onClick={() => setOrderSide('sell')}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    orderSide === 'sell'
                      ? 'bg-rose-500 text-white shadow-[0_0_24px_-4px_rgba(244,63,94,0.7)]'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sell {activeSymbol}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {(['limit', 'market'] as OrderType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderType(type)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition cursor-pointer ${
                        orderType === type
                          ? 'border border-white/20 bg-white/[0.1] text-white'
                          : 'border border-transparent text-slate-400 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <span className="font-mono text-[11px] tabular-nums text-slate-400">
                  Avail:{' '}
                  <span className="text-slate-200">
                    {orderSide === 'buy'
                      ? `$${usdtBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
                      : `${holdings[activeSymbol].toFixed(4)} ${activeSymbol}`}
                  </span>
                </span>
              </div>

              <form onSubmit={handleSubmitOrder} className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Price (USDT)</span>
                    {orderType === 'limit' && (
                      <button
                        type="button"
                        onClick={() =>
                          setLimitPriceInput(activeTicker.price.toFixed(activeTicker.decimals))
                        }
                        className="text-emerald-400 hover:underline cursor-pointer"
                      >
                        Last
                      </button>
                    )}
                  </label>
                  <input
                    type="number"
                    step="any"
                    disabled={orderType === 'market'}
                    value={
                      orderType === 'market'
                        ? activeTicker.price.toFixed(activeTicker.decimals)
                        : limitPriceInput
                    }
                    onChange={(e) => setLimitPriceInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#060913]/85 px-3 py-2.5 font-mono text-sm tabular-nums text-white outline-none transition focus:border-emerald-400/50 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Amount ({activeSymbol})</span>
                    <span className="font-mono tabular-nums text-slate-500">
                      Min 0.001 {activeSymbol}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#060913]/85 px-3 py-2.5 font-mono text-sm tabular-nums text-white outline-none transition focus:border-emerald-400/50"
                  />
                </div>

                {/* Quick Size Percentage Pills */}
                <div className="grid grid-cols-4 gap-1.5">
                  {[0.25, 0.5, 0.75, 1].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applySizePercent(pct)}
                      className="rounded-lg border border-white/10 bg-white/[0.03] py-1 font-mono text-[11px] text-slate-300 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-white cursor-pointer"
                    >
                      {pct * 100}%
                    </button>
                  ))}
                </div>

                {/* Total & Fee Summary */}
                <div className="space-y-1 rounded-xl border border-white/10 bg-[#060913]/70 p-3 font-mono text-xs tabular-nums">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Est. Total</span>
                    <span className="font-semibold text-white">
                      ${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Maker/Taker Fee (0.08%)</span>
                    <span>${estimatedFee.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wide transition-all cursor-pointer ${
                    orderSide === 'buy'
                      ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-[0_0_28px_-6px_rgba(16,185,129,0.75)]'
                      : 'bg-rose-500 text-white hover:bg-rose-400 shadow-[0_0_28px_-6px_rgba(244,63,94,0.75)]'
                  }`}
                >
                  <Zap className="h-4 w-4" />
                  <span>
                    {orderSide === 'buy' ? 'Place Buy' : 'Place Sell'} {orderType.toUpperCase()} Order
                  </span>
                </button>
              </form>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Zero-slippage simulated institutional matching engine</span>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
