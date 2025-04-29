import { createConnection } from '../config/database.js';
import { exec } from 'child_process';

// PowerShell command without encoding parameter
const psCommand = `powershell -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Get-ADUser -SearchBase 'OU=Utilisateurs,OU=GROUPE FRANCE COURTAGE,DC=fcourtage1,DC=local' -Filter * -Properties Mail | Where-Object { $_.Mail -ne $null } | Select-Object Name, SamAccountName | ConvertTo-Csv -NoTypeInformation"`;

// Function to clean special characters
const cleanName = (name) => {
    // Première passe : remplacement des caractères spéciaux connus
    const specialChars = {
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'à': 'a', 'â': 'a', 'ä': 'a',
        'ï': 'i', 'î': 'i',
        'ô': 'o', 'ö': 'o',
        'ù': 'u', 'û': 'u', 'ü': 'u',
        'ÿ': 'y',
        'ç': 'c',
        'É': 'E', 'È': 'E', 'Ê': 'E',
        'À': 'A', 'Â': 'A',
        'Î': 'I',
        'Ô': 'O',
        'Û': 'U', 'Ù': 'U',
        'Ç': 'C'
    };

    // Deuxième passe : normalisation Unicode et remplacement des caractères non-ASCII
    let cleaned = name;
    
    // Remplacer les caractères spéciaux connus
    for (let [char, replacement] of Object.entries(specialChars)) {
        cleaned = cleaned.split(char).join(replacement);
    }
    
    // Normaliser et remplacer les caractères restants
    cleaned = cleaned
        .normalize('NFD')  // Décompose les caractères accentués
        .replace(/[\u0300-\u036f]/g, '')  // Supprime les diacritiques
        .replace(/[^\x00-\x7F]/g, function(char) {  // Remplace les caractères non-ASCII restants
            // Mappings supplémentaires pour les caractères problématiques
            const extraMappings = {
                '�': 'e',
                '´': '',
                '`': '',
                '°': 'o',
                '²': '2',
                '³': '3',
                '±': '+/-',
                '×': 'x',
                '÷': '/',
                '¿': '?',
                '¡': '!',
                '¢': 'c',
                '£': 'L',
                '¤': '$',
                '¥': 'Y',
                '¦': '|',
                '§': 'S',
                '¨': '',
                '©': '(c)',
                'ª': 'a',
                '«': '<',
                '¬': '-',
                '®': '(r)',
                '¯': '-',
                '¹': '1',
                'º': 'o',
                '»': '>',
                '¼': '1/4',
                '½': '1/2',
                '¾': '3/4',
                '¿': '?',
                'À': 'A',
                'Á': 'A',
                'Â': 'A',
                'Ã': 'A',
                'Ä': 'A',
                'Å': 'A',
                'Æ': 'AE',
                'Ç': 'C',
                'È': 'E',
                'É': 'E',
                'Ê': 'E',
                'Ë': 'E',
                'Ì': 'I',
                'Í': 'I',
                'Î': 'I',
                'Ï': 'I',
                'Ð': 'D',
                'Ñ': 'N',
                'Ò': 'O',
                'Ó': 'O',
                'Ô': 'O',
                'Õ': 'O',
                'Ö': 'O',
                '×': 'x',
                'Ø': 'O',
                'Ù': 'U',
                'Ú': 'U',
                'Û': 'U',
                'Ü': 'U',
                'Ý': 'Y',
                'Þ': 'Th',
                'ß': 'ss',
                'à': 'a',
                'á': 'a',
                'â': 'a',
                'ã': 'a',
                'ä': 'a',
                'å': 'a',
                'æ': 'ae',
                'ç': 'c',
                'è': 'e',
                'é': 'e',
                'ê': 'e',
                'ë': 'e',
                'ì': 'i',
                'í': 'i',
                'î': 'i',
                'ï': 'i',
                'ð': 'd',
                'ñ': 'n',
                'ò': 'o',
                'ó': 'o',
                'ô': 'o',
                'õ': 'o',
                'ö': 'o',
                'ø': 'o',
                'ù': 'u',
                'ú': 'u',
                'û': 'u',
                'ü': 'u',
                'ý': 'y',
                'þ': 'th',
                'ÿ': 'y'
            };
            return extraMappings[char] || '';
        });

    return cleaned;
};

// Function to process PowerShell output
const processUsers = (stdout) => {
    const lines = stdout
        .trim()
        .split('\n')
        .slice(1) // Enlève l'en-tête
        .map(line => line.trim()) // Supprime les espaces inutiles

    return lines.map(line => {
        // Vérifie si la ligne est vide
        if (!line || line.split(',').length < 2) {
            console.log('⚠️ Ligne ignorée (format invalide):', line);
            return null;
        }

        // Nettoyage des guillemets et séparation correcte
        const [name, login] = line.replace(/"/g, '').split(',').map(val => val.trim());

        if (!name || !login) {
            console.log('⚠️ Ligne ignorée (données manquantes):', line);
            return null;
        }

        const cleanedName = cleanName(name);

        return {
            originalName: name,
            cleanedName: cleanedName,
            login: login
        };
    }).filter(user => user !== null);
};


// Function to insert data into MySQL
// Function to insert or update data into MySQL
// Function to insert only new users into MySQL without duplicating existing ones
const insertUsersIntoDB = async (users) => {
    const connection = await createConnection();

    try {
        // 1. Récupérer les logins existants pour éviter les doublons
        const [existingUsersRows] = await connection.query("SELECT login FROM user");
        const existingLogins = new Set(existingUsersRows.map(row => row.login));

        // 2. Insérer uniquement les nouveaux utilisateurs
        let newUsersCount = 0;
        for (const user of users) {
            if (!existingLogins.has(user.login)) {
                await connection.execute(
                    `INSERT INTO user (libelle, login) VALUES (?, ?)`,
                    [user.cleanedName, user.login]
                );
                newUsersCount++;
            } else {
                console.log(`🔄 Utilisateur déjà existant ignoré : ${user.login}`);
            }
        }

        if (newUsersCount > 0) {
            console.log(`✅ ${newUsersCount} nouveaux utilisateurs insérés.`);
        } else {
            console.log("✅ Aucun nouvel utilisateur à insérer.");
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'insertion des données :', error);
    } finally {
        await connection.end();
    }
};



// Execute PowerShell command with UTF-8 encoding
const options = {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 // 1MB buffer
};

exec(psCommand, options, async (error, stdout, stderr) => {
    if (error) {
        console.error(`❌ Erreur lors de l'exécution de la commande : ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`⚠️ Erreur PowerShell : ${stderr}`);
        return;
    }

    // Process the data in memory first
    const users = processUsers(stdout);

    // Debug: afficher le nombre d'utilisateurs traités
    console.log(`📊 Nombre d'utilisateurs traités : ${users.length}`);

    if (users.length > 0) {
        await insertUsersIntoDB(users);
    } else {
        console.log("⚠️ Aucun utilisateur à insérer.");
    }
});