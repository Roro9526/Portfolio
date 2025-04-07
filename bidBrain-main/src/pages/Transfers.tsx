import { useState } from "react";
import { motion } from "framer-motion";

export default function VirementForm() {
    const [users, setUsers] = useState<string[]>(['Alice', 'Bob', 'Charlie']);
    const [montant, setMontant] = useState("");
    const [destinataire, setDestinataire] = useState("");
    const [showPopup, setShowPopup] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setShowPopup(true);
        setTimeout(() => setShowPopup(false), 3000);
    };

    return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
            <div className="w-96 p-6 shadow-lg bg-white rounded-2xl">
                <h2 className="text-xl font-semibold text-center mb-4">Virement Bancaire</h2>
                <div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-gray-700">Montant</label>
                            <input
                                type="number"
                                value={montant}
                                onChange={(e) => setMontant(e.target.value)}
                                className="w-full mt-1 p-2 border rounded"
                                required
                            />
                        </div>
                        <div>
                            <select
                                onChange={(e) => setDestinataire(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            >
                                <option value="">Sélectionner un utilisateur</option>
                                {users.map((user) => (
                                    <option key={user} value={user}>
                                        {user}
                                    </option>
                                ))}
                            </select>

                        </div>
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
                            Valider le virement
                        </button>
                    </form>
                </div>
            </div>

            {showPopup && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-5 right-5 bg-green-500 text-white p-4 rounded-lg shadow-lg flex items-center gap-2"
                >
                    <span className="w-6 h-6">✔</span>
                    <span>Virement effectué avec succès!</span>
                </motion.div>
            )}
        </div>
    );
}
