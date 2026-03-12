import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Clean filename and make unique
        const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "");
        const filename = `${Date.now()}-${safeName}`;
        const uploadDir = join(process.cwd(), "public", "uploads");

        // Ensure directory exists
        await mkdir(uploadDir, { recursive: true });

        const filepath = join(uploadDir, filename);

        // Write file
        await writeFile(filepath, buffer);

        return NextResponse.json({ url: `/uploads/${filename}` });
    } catch (e) {
        console.error("Upload error:", e);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
