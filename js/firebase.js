// js/firebase.js - Модуль для роботи з Firebase (опціонально)

const FirebaseService = {
    // Базовий URL бази даних
    dbUrl: "https://ukrmova-game-default-rtdb.eu// js/firebase.js - Модуль для роботи з Firebase (опціонально)

const FirebaseService = {
    // Базовий URL бази даних
    dbUrl: "https://ukrmova-game-default-rtdb.europe-west1.firebasedatabase.app/",
    
    // Отримання даних користувача
    async getUser(nickname) {
        try {
            const response = await fetch(`${this.dbUrl}users/${nickname}.json`);
            return await response.json();
        } catch (error) {
            console.error('Помилка отримання користувача:', error);
            return null;
        }
    },
    
    // Збереження даних користувача
    async saveUser(nickname, userData) {
        try {
            const response = await fetch(`${this.dbUrl}users/${nickname}.json`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            return response.ok;
        } catch (error) {
            console.error('Помилка збереження користувача:', error);
            return false;
        }
    },
    
    // Видалення користувача
    async deleteUser(nickname) {
        try {
            const response = await fetch(`${this.dbUrl}users/${nickname}.json`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Помилка видалення користувача:', error);
            return false;
        }
    },
    
    // Отримання всіх користувачів
    async getAllUsers() {
        try {
            const response = await fetch(`${this.dbUrl}users/.json`);
            return await response.json();
        } catch (error) {
            console.error('Помилка отримання всіх користувачів:', error);
            return null;
        }
    },
    
    // Додавання запису в лог
    async addLog(logName, data) {
        try {
            await fetch(`${this.dbUrl}${logName}.json`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return true;
        } catch (error) {
            console.error(`Помилка додавання в лог ${logName}:`, error);
            return false;
        }
    },
    
    // Отримання логів
    async getLogs(logName) {
        try {
            const response = await fetch(`${this.dbUrl}${logName}.json`);
            return await response.json();
        } catch (error) {
            console.error(`Помилка отримання логів ${logName}:`, error);
            return null;
        }
    },
    
    // Очищення логів
    async clearLogs(logName) {
        try {
            await fetch(`${this.dbUrl}${logName}.json`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error(`Помилка очищення логів ${logName}:`, error);
            return false;
        }
    }
};

// Експортуємо для використання в інших файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseService;
}rope-west1.firebasedatabase.app/",
    
    // Отримання даних користувача
    async getUser(nickname) {
        try {
            const response = await fetch(`${this.dbUrl}users/${nickname}.json`);
            return await response.json();
        } catch (error) {
            console.error('Помилка отримання користувача:', error);
            return null;
        }
    },
    
    // Збереження даних користувача
    async saveUser(nickname, userData) {
        try {
            const response = await fetch(`${this.dbUrl}users/${nickname}.json`, {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            return response.ok;
        } catch (error) {
            console.error('Помилка збереження користувача:', error);
            return false;
        }
    },
    
    // Видалення користувача
    async deleteUser(nickname) {
        try {
            const response = await fetch(`${this.dbUrl}users/${nickname}.json`, {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('Помилка видалення користувача:', error);
            return false;
        }
    },
    
    // Отримання всіх користувачів
    async getAllUsers() {
        try {
            const response = await fetch(`${this.dbUrl}users/.json`);
            return await response.json();
        } catch (error) {
            console.error('Помилка отримання всіх користувачів:', error);
            return null;
        }
    },
    
    // Додавання запису в лог
    async addLog(logName, data) {
        try {
            await fetch(`${this.dbUrl}${logName}.json`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return true;
        } catch (error) {
            console.error(`Помилка додавання в лог ${logName}:`, error);
            return false;
        }
    },
    
    // Отримання логів
    async getLogs(logName) {
        try {
            const response = await fetch(`${this.dbUrl}${logName}.json`);
            return await response.json();
        } catch (error) {
            console.error(`Помилка отримання логів ${logName}:`, error);
            return null;
        }
    },
    
    // Очищення логів
    async clearLogs(logName) {
        try {
            await fetch(`${this.dbUrl}${logName}.json`, {
                method: 'DELETE'
            });
            return true;
        } catch (error) {
            console.error(`Помилка очищення логів ${logName}:`, error);
            return false;
        }
    }
};

// Експортуємо для використання в інших файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirebaseService;
}
