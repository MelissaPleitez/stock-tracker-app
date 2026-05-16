import axios, { get } from 'axios';
import WebSocket from 'ws';
import { env } from '../config/env';
import { io } from '../index';
import { FinnhubQuoteResponse, StockQuote } from '../types';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Stocks that are goint to be showing
export const TRACKED_SYMBOLS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

// Current prices in memory for alert checking
export const currentPrices: Record<string, number> = {};

// Getting actual prices via REST
export const getStockQuote = async (symbol: string): Promise<StockQuote> => {
    const response = await axios.get<FinnhubQuoteResponse>(
        `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${env.FINNHUB_API_KEY}`
    );

    const data = response.data;

    currentPrices[symbol] = data.c;

    return {
        symbol,
        price: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc,
    }
}

// Getting all stock quotes at once
export const getAllQuotes = async (): Promise<StockQuote[]> => {
  const quotes = await Promise.all(
    TRACKED_SYMBOLS.map((symbol)=> getStockQuote(symbol))
  )
  return quotes;
};

// WebSocket for real-time updates
export const initFinnhubWebSocket = () => {
  console.log('Attempting Finnhub WebSocket connection...');
    const ws = new WebSocket(
    `wss://ws.finnhub.io?token=${env.FINNHUB_API_KEY}`);

   ws.on('open', () => {
    console.log('Finnhub WebSocket connected');
    TRACKED_SYMBOLS.forEach((symbol) => {
        ws.send(JSON.stringify({type: 'subscribe', symbol}));
    });
   });

   // Listen data from WebSocket
  ws.on('message', (rawData: WebSocket.RawData) => {
    const data = JSON.parse(rawData.toString());

    if (data.type === 'trade' && data.data) {
      data.data.forEach((trade: { s: string; p: number }) => {
        const symbol = trade.s;
        const price = trade.p;

        currentPrices[symbol] = price;

        //send real-time price update to conected clients (frontend)
        io.emit('price_update', { symbol, price });
      });
    }
  });

  ws.on('error', (error) => {
    console.error('Finnhub WebSocket error:', error.message);
  });

  ws.on('unexpected-response', (req, res) => {
  console.error('Unexpected response:', res.statusCode, res.statusMessage);
});

  ws.on('close', () => {
    console.log('Finnhub WebSocket disconnected, reconnecting in 5s...');
    setTimeout(initFinnhubWebSocket, 5000);
  });
};