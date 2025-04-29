import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  login: string;
  libelle: string;
  role: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data);
      setFilteredUsers(response.data);
    } catch (err) {
      setError('Erreur lors de la récupération des utilisateurs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (id: number, role: string) => {
    try {
      await axios.put(`/api/users/${id}`, { role });
      fetchUsers(); // Rafraîchit la liste des utilisateurs après modification
    } catch (err) {
      console.error('Erreur lors de la mise à jour du rôle de l\'utilisateur :', err);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    const filtered = users.filter(user =>
      user.login.toLowerCase().includes(value) ||
      user.libelle.toLowerCase().includes(value) ||
      user.role.toLowerCase().includes(value)
    );
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return <div>Chargement des utilisateurs...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="mt-8 bg-[var(--bg-color)] text-[var(--text-color)] rounded-lg shadow p-6 border border-[var(--border-color)]">
      <h2 className="text-xl font-bold mb-4">Gestion des utilisateurs</h2>

      {/* Champ de recherche */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)]"
        />
      </div>

      {/* Tableau des utilisateurs */}
      <table className="min-w-full border-collapse text-[var(--text-color)]">
        <thead>
          <tr>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Nom d'utilisateur</th>
            <th className="border px-4 py-2">Libellé</th>
            <th className="border px-4 py-2">Rôle</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <tr key={user.id}>
                <td className="border px-4 py-2">{user.id}</td>
                <td className="border px-4 py-2">{user.login}</td>
                <td className="border px-4 py-2">{user.libelle}</td>
                <td className="border px-4 py-2">
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    className="bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--border-color)] p-1 rounded"
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="text-center py-4">
                Aucun utilisateur trouvé.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
