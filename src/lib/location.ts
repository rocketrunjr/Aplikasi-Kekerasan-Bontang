export async function getDeviceLocation(): Promise<{ latitude: number, longitude: number }> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            return reject(new Error("Browser atau perangkat Anda tidak mendukung pelacakan fitur GPS (Lokasi)."));
        }

        const fallbackToLowAccuracy = (errMessage: string) => {
            console.warn(`High accuracy failed: ${errMessage}, falling back to network location...`);
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                (err) => reject(new Error(parseGeolocationError(err))),
                {
                    enableHighAccuracy: false,
                    timeout: 20000,
                    maximumAge: 10000, // Reuse cached position up to 10 seconds ago
                }
            );
        };

        // Try high accuracy first
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
            (err) => {
                // If permission denied immediately (code 1), don't even try fallback
                if (err.code === err.PERMISSION_DENIED) {
                    return reject(new Error(parseGeolocationError(err)));
                }
                // High accuracy failed or timed out, try low accuracy
                fallbackToLowAccuracy(err.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    });
}

function parseGeolocationError(error: GeolocationPositionError): string {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return "Izin lokasi diblokir. Silakan ketuk ikon kunci 🔒 di URL browser atas, lalu BERIKAN IZIN (Allow) pada menu Lokasi.";
        case error.POSITION_UNAVAILABLE:
            return "Informasi GPS/Lokasi tidak tersedia (Sinyal satelit atau jaringan lemah).";
        case error.TIMEOUT:
            return "Waktu pencarian sinyal GPS habis (Timeout). Berdiri di luar ruangan atau dekat jendela dapat membantu.";
        default:
            return `Terjadi kesalahan saat mendeteksi titik GPS: ${error.message}`;
    }
}
