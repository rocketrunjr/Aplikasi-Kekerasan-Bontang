import { defineConfig } from "drizzle-kit";
import "dotenv/config"; // Ini penting agar Drizzle membaca file .env

export default defineConfig({
    schema: "./src/db/schema.ts", // (Biarkan bagian ini sesuai dengan aslinya di laptop Anda)
    out: "./drizzle",             // (Biarkan bagian ini sesuai aslinya)

    dialect: "turso", // Pastikan dialect-nya mendukung Turso (atau gunakan "sqlite" dengan driver "turso" di versi lama)

    dbCredentials: {
        url: process.env.DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN, // Tambahkan baris ini untuk membaca token
    },
});