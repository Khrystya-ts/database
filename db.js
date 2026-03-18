import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: `${process.env.DB_URL}`
});

const initializeDatabase = async () => {
    console.log('Initializing database.');
    const createTableQuery = `
    CREATE TABLE IF NOT EXISTS dogs (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        breed TEXT NOT NULL,
        age TEXT,
        gender TEXT,
        weight TEXT,
        color TEXT,
        owner TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `;
    await pool.query(createTableQuery);
    console.log('Database table initialized successfully.');
};

async function addInfo(data) {
    if (!data || data.length < 7) {
        console.error("Помилка: Недостатньо даних! Треба 7 параметрів.");
        return;
    }
    const insertQuery = `
        INSERT INTO dogs (name, breed, age, gender, weight, color, owner) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await pool.query(insertQuery, data);
    console.log(`Собака ${data[0]} додана успішно!`);
}

async function deleteInfo(id) {
    if (!id) {
        console.error("Помилка: Вкажіть ID для видалення.");
        return;
    }
    const result = await pool.query('DELETE FROM dogs WHERE id = $1', [id]);
    if (result.rowCount === 0) {
        console.log(`Собаку з ID ${id} не знайдено.`);
    } else {
        console.log(`Собаку з ID ${id} видалено.`);
    }
}

async function updateField(id, column, newValue) {
    if (!id || !column || !newValue) {
        console.error("Помилка: Треба вказати ID, назву колонки та нове значення.");
        return;
    }
    const allowedColumns = ['name', 'breed', 'age', 'gender', 'weight', 'color', 'owner'];

    if (!allowedColumns.includes(column)) {
        console.error(`Помилка: Колонки '${column}' не існує або її не можна змінювати.`);
        return;
    }

    const updateQuery = `UPDATE dogs SET ${column} = $1 WHERE id = $2`;
    const result = await pool.query(updateQuery, [newValue, id]);

    if (result.rowCount === 0) {
        console.log(`Собаку з ID ${id} не знайдено.`);
    } else {
        console.log(`Успішно оновлено поле '${column}' для собаки з ID ${id} на '${newValue}'!`);
    }
}

async function getData() {
    const { rows } = await pool.query('SELECT * FROM dogs ORDER BY id ASC');
    if (rows.length === 0) {
        console.log("База порожня.");
    } else {
        console.table(rows);
    }
}

async function run() {
    const command = process.argv[2];

    try {
        switch (command) {
            case 'help':
                console.log("\n" + "=".repeat(50));
                console.log("  DOG DATABASE MANAGER v1.0  ");
                console.log("=".repeat(50));
                console.log("\n ДОСТУПНІ КОМАНДИ:");

                console.log("\n   ПЕРЕГЛЯД:");
                console.log("    node database.js list          -> Показати всіх собак");

                console.log("\n   ДОДАВАННЯ:");
                console.log("    node database.js add [name] [breed] [age] [gender] [weight] [color] [owner]");
                console.log("     Порада: Якщо значення з пробілами, бери його в \"лапки\"");

                console.log("\n   КЕРУВАННЯ:");
                console.log("    node database.js update [id] [field] [value] -> Оновити дані");
                console.log("    node database.js delete [id]                 -> Видалити собаку з бази");

                console.log("\n    СИСТЕМНІ:");
                console.log("    node database.js init          -> Скинути базу та створити заново");
                console.log("    node database.js help          -> Показати це меню");

                console.log("\n ДОСТУПНІ ПОЛЯ ДЛЯ UPDATE:");
                console.log("   name, breed, age, gender,");
                console.log("   weight, color, owner");

                console.log("\n" + "=".repeat(50) + "\n");
                break;

            case 'list':
                await getData();
                break;

            case 'init':
                console.log('🧹 Очищення та ініціалізація...');
                await pool.query('DROP TABLE IF EXISTS dogs');
                await initializeDatabase();
                const defaultDog = ['Рекс', 'Німецька вівчарка', '3', 'Самець', '32kg', 'Чорно-рудий', 'Олексій'];
                await addInfo(defaultDog);
                break;

            case 'add':
                await addInfo(process.argv.slice(3));
                break;

            case 'delete':
                await deleteInfo(process.argv[3]);
                break;

            case 'update':
                const id = process.argv[3];
                const column = process.argv[4];
                const value = process.argv[5];
                await updateField(id, column, value);
                break;

            default:
                console.log("Невідома команда. Спробуй 'node database.js help'");
        }
    } catch (err) {
        console.error("Помилка:", err.message);
    } finally {
        await pool.end();
        console.log("З'єднання закрите.");
    }
}

run();