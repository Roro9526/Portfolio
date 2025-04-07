import React from 'react';
import { useCryptoStore } from '../store/cryptoStore';

function Portfolio() {
  const { portfolio, assets, balance, depositMoney } = useCryptoStore();

  const getCryptoInfo = (id) => assets.find((a) => a.id === id) || {};

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Mon Portefeuille</h1>

      <div className="p-4 bg-white shadow rounded-lg mb-4">
        <p className="text-lg font-semibold">Solde disponible : {balance.toFixed(2)} EUR</p>
        <button
          onClick={() => depositMoney(500)}
          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Déposer 500€
        </button>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3">Mes Cryptos</h2>
        {portfolio.length === 0 ? (
          <p className="text-gray-600">Aucune crypto détenue.</p>
        ) : (
          <ul>
            {portfolio.map(({ id, amount }) => {
              const { name, current_price, symbol, image } = getCryptoInfo(id);
              return (
                <li key={id} className="flex items-center justify-between p-2 border-b">
                  <div className="flex items-center">
                    <img src={image} alt={name} className="w-10 h-10 rounded-full mr-3" />
                    <div>
                      <p className="font-semibold">{name} ({symbol.toUpperCase()})</p>
                      <p className="text-gray-500">Quantité : {amount.toFixed(4)}</p>
                    </div>
                  </div>
                  <p className="font-semibold">
                    {(amount * current_price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Portfolio;
