import {NextRequest, NextResponse} from "next/server";
import {MeteoQueries} from "@/lib/db/queries";
import dotenv from 'dotenv';
import {verifyRequest} from "@/lib/auth/api";

export async function GET(request: NextRequest) {
    const verification = await verifyRequest(request)
    if ('error' in verification) return verification.error

    dotenv.config();
    const searchParams = request.nextUrl.searchParams;
    const day = searchParams.get("day");

    if (!day) {
        throw new Error("Missing day parameter");
    }

    const savedMeteo = await MeteoQueries.getMeteoByDay(verification.userId, day);

    const oneHourAgo = new Date(Date.now() - 3600 * 1000);

    if (savedMeteo.length === 0 || savedMeteo[0].updated_at < oneHourAgo) { // Update every hour
        const lat = searchParams.get("lat");
        if (!lat) {
            throw new Error("Missing lat parameter");
        }
        const lon = searchParams.get("lon");
        if (!lon) {
            throw new Error("Missing lon parameter");
        }

        const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${process.env.OPENWEATHERMAP_API_KEY}`;
        const result = await fetch(url);

        if (!result.ok) {
            throw new Error("Failed to fetch weather data");
        }

        const data = await result.json();

        if (savedMeteo.length === 0) {
            await MeteoQueries.createMeteo(verification.userId, day, parseInt(data.daily[0].feels_like.day as string), data.daily[0].summary, data.daily[0].weather[0].icon, lat, lon);
        } else {
            await MeteoQueries.updateMeteo(verification.userId, day, parseInt(data.daily[0].feels_like.day as string), data.daily[0].summary, data.daily[0].weather[0].icon, lat, lon);
        }

        // Fetch the updated/created meteo record to get the complete data with ID
        const updatedMeteo = await MeteoQueries.getMeteoByDay(verification.userId, day);
        return NextResponse.json(updatedMeteo[0]);
    } else {
        return NextResponse.json(savedMeteo[0]);
    }
}