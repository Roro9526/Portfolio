import React from "react";

export const Layout = ({ children, currentPage, setCurrentPage }) => {
    return (
        <div className="min-h-screen bg-white">
            {/* Top Navigation Bar */}
            <nav className="bg-white border-b border-gray-300 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Portfolio Tracker</h1>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setCurrentPage("dashboard")}
                                className={`px-6 py-2 rounded font-medium transition-colors ${currentPage === "dashboard"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => setCurrentPage("predictions")}
                                className={`px-6 py-2 rounded font-medium transition-colors ${currentPage === "predictions"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    }`}
                            >
                                Predictions
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
};
