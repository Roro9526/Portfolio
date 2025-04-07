import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCryptoStore } from '../store/cryptoStore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TradingForm from '../components/TradingForm';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function CryptoDetail() {
  const { id } = useParams();
  const { assets, selectedTimeframe, setTimeframe, fetchPriceHistory } = useCryptoStore();
  const [priceHistory, setPriceHistory] = useState<any>(null);
  const asset = assets.find((a) => a.id === id);

  useEffect(() => {
    if (id) {
      fetchPriceHistory(id).then(setPriceHistory);
    }
  }, [id, selectedTimeframe, fetchPriceHistory]);

  if (!asset) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  const chartData = priceHistory ? {
    labels: priceHistory.prices.map(([timestamp]: [number, number]) =>
      format(new Date(timestamp), selectedTimeframe === '1h' ? 'HH:mm' : 'dd MMM', { locale: fr })
    ),
    datasets: [
      {
        label: 'Prix',
        data: priceHistory.prices.map(([, price]: [number, number]) => price),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.1,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Évolution du prix - ${asset.name}`,
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value: number) =>
            value.toLocaleString('fr-FR', {
              style: 'currency',
              currency: 'EUR',
            }),
        },
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center mb-6">
              <img
                src={asset.image}
                alt={asset.name}
                className="w-16 h-16 rounded-full"
              />
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-gray-900">{asset.name}</h1>
                <p className="text-xl text-gray-600">{asset.symbol.toUpperCase()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Prix actuel</p>
                <p className="text-xl font-semibold">
                  {asset.current_price.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Variation 24h</p>
                <p
                  className={`text-xl font-semibold ${
                    asset.price_change_percentage_24h >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {asset.price_change_percentage_24h.toFixed(2)}%
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Volume 24h</p>
                <p className="text-xl font-semibold">
                  {asset.total_volume.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex space-x-2">
                {(['1h', '24h', '7d', '30d'] as const).map((timeframe) => (
                  <button
                    key={timeframe}
                    onClick={() => setTimeframe(timeframe)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      selectedTimeframe === timeframe
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {timeframe}
                  </button>
                ))}
              </div>
            </div>

            {chartData && (
              <div className="h-[400px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Trading</h2>
            <TradingForm cryptoId={asset.id} currentPrice={asset.current_price} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CryptoDetail;