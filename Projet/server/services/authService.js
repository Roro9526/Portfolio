import ldap from 'ldapjs';
import dotenv from 'dotenv';
import { createConnection } from '../config/database.js'; // Connexion DB
import { fixEncoding } from '../utils/textProcessing.js';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const LDAP_URL = process.env.LDAP_URL || 'ldap://fcourtage1.local';
const BASE_DN = process.env.LDAP_BASE_DN || 'OU=GROUPE FRANCE COURTAGE,DC=fcourtage1,DC=local';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Récupère le libelle associé au LOGIN (SamAccountName)
 */
const getLibelleFromLogin = async (login) => {
    const connection = await createConnection();
   
    try {
        // Sélectionner à la fois l'ID et le libelle de l'utilisateur
        const [rows] = await connection.query(
            "SELECT id, libelle,role FROM user WHERE login = ?",  // Remplacer 'login' par le nom de la colonne exacte dans ta base de données
            [login]
        );
        
        if (rows.length > 0) {
            //const NewLibelle = fixEncoding();
            console.log(rows);
            console.log(`🔍 ID, libelle et role trouvés pour ${login}: ${rows[0].id}, ${rows[0].libelle}, ${rows[0].role}`);
            console.log(rows[0].role)
            return { id: rows[0].id, libelle: rows[0].libelle, role: rows[0].role };
        } else {
            console.warn(`⚠️ Aucun utilisateur trouvé pour ${login}`);
            return null;
        }
    } catch (error) {
        console.error("❌ Erreur lors de la récupération de l'ID et du libelle :", error);
        throw error;
    } finally {
        await connection.end();
    }
};

/**
 * Recharge la base de données utilisateur via adlearning.js
 */
const reloadUsersFromAD = () => {
    return new Promise((resolve, reject) => {
        const adlearningPath = path.join(__dirname, 'adlearning.js');
        
        console.log(`🔄 Début de la mise à jour des utilisateurs via ${adlearningPath}`);
        
        exec(`node "${adlearningPath}"`, { cwd: __dirname }, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ Erreur lors de la mise à jour des utilisateurs via ADLearning :', error);
                return reject(error);
            }
            if (stderr) {
                console.error('⚠️ Avertissement ADLearning :', stderr);
            }
            console.log('✅ Mise à jour des utilisateurs terminée avec succès.');
            resolve();
        });
    });
};

/**
 * Authentifie un utilisateur en utilisant LOGIN -> Libelle -> LDAP
 */
export const authenticateUser = async (login, password) => {
    let userInfo = await getLibelleFromLogin(login);

    // Si l'utilisateur n'existe pas, on tente une recharge de la base de données
    if (!userInfo) {
        console.warn(`⚠️ Utilisateur ${login} introuvable. Tentative de mise à jour via ADLearning...`);
        
        try {
            await reloadUsersFromAD();
            userInfo = await getLibelleFromLogin(login);  // On retente de trouver l'utilisateur après la mise à jour
            
            if (!userInfo) {
                return { success: false, message: 'Utilisateur introuvable après mise à jour.' };
            }
        } catch (error) {
            return { success: false, message: 'Erreur lors de la mise à jour des utilisateurs.' };
        }
    }

    const { id: userId, libelle,role } = userInfo;
    const fixedLibelle = fixEncoding(libelle);

    return new Promise((resolve) => {
        const client = ldap.createClient({
            url: LDAP_URL,
            tlsOptions: { rejectUnauthorized: false }
        });

        const userDN = `CN=${fixedLibelle},OU=Utilisateurs,${BASE_DN}`;

        console.log(`🔐 Tentative de connexion LDAP avec : ${userDN}`);

        client.bind(userDN, password, (err) => {
            if (err) {
                console.error(`❌ Échec de connexion LDAP pour ${fixedLibelle}: Mot de passe incorrect`);
                client.unbind();
                return resolve({ success: false, message: 'Identifiants incorrects' });
            }

            console.log(`✅ Connexion LDAP réussie pour ${fixedLibelle}`);

            const opts = {
                filter: `(cn=${fixedLibelle})`,
                scope: 'sub',
                attributes: ['cn', 'mail', 'displayName', 'memberOf'],
            };

            client.search(BASE_DN, opts, (searchErr, res) => {
                if (searchErr) {
                    console.error('❌ Erreur lors de la recherche utilisateur :', searchErr);
                    client.unbind();
                    return resolve({ success: false, message: 'Erreur lors de la recherche utilisateur' });
                }

                res.on('searchEntry', async (entry) => {
                    const userObject = entry.pojo ? entry.pojo : entry.object;
                    if (!userObject) {
                        console.error("❌ Aucun utilisateur trouvé ou structure inattendue.");
                        client.unbind();
                        return resolve({ success: false, message: 'Utilisateur non trouvé après recherche LDAP.' });
                    }

                    console.log(`✅ Utilisateur trouvé : ${userObject.cn}`);
                    client.unbind();
                    return resolve({
                        success: true,
                        message: 'Authentification réussie',
                        user: { username: fixedLibelle, iduser: userId, groups: role && role === 'admin' ? ['admin'] : ['user'] }
                    });
                });

                res.on('error', (err) => {
                    console.error('❌ Erreur LDAP :', err);
                    client.unbind();
                    resolve({ success: false, message: 'Erreur lors de la recherche utilisateur' });
                });
            });
        });
    });
};
