import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Endpoint for Alpin Sun Clock Philosophy
app.post("/api/philosophy", async (req, res) => {
  try {
    const {
      alpinHour,
      isDaytime,
      hourName,
      hourDescription,
      latitude,
      longitude,
      cityName,
      dateString,
    } = req.body;

    const timeOfDay = isDaytime ? "Gündüz" : "Gece";
    const coordinatesText = `Enlem: ${latitude?.toFixed(4)}, Boylam: ${longitude?.toFixed(4)}`;

    const prompt = `
Sen kadim zamanlardan gelen bilge bir gökbilimci ve zaman felsefecisisin.
"Alpin Güneş Saati" adlı özel bir sistemdeyiz. Bu sistemde gündüz güneşin doğuşundan batışına kadar olan süre tam 12 eşit parçaya; gece ise gün batımından gün doğumuna kadar olan süre tam 12 eşit parçaya bölünmüştür.

Şu anki durum:
- Konum: ${cityName || "Bilinmeyen Konum"} (${coordinatesText})
- Seçili Tarih: ${dateString || "Bugün"}
- Solar Periyot: ${timeOfDay}
- Alpin Saati: ${alpinHour}. Saat (${hourName})
- Bu Saatin Anlamı: ${hourDescription}

Senden ricam; bu özel saatin astronomik ve ruhsal anlamına uygun, Türkçe dilinde, derin, ilham verici, kısa ve edebi bir zaman felsefesi (günün kozmik felsefesi) yazman. 
Yazın şiirsel, akıcı ve bilgelik dolu olmalı. Lütfen maksimum 70-80 kelime olsun. 
Başlık kullanma, doğrudan felsefi düşünceyle başla ve okuana dinginlik verecek şekilde tamamla.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });

    const philosophyText = response.text || "Yıldızlar şu an fısıldamıyor, evrenin ritmine kulak vermeye devam edin.";
    res.json({ philosophy: philosophyText.trim() });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Evrensel felsefe fısıltısı alınamadı.", details: error.message });
  }
});

// Serve Frontend
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log(`Vite development middleware mounted.`);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
    console.log(`Serving static files from dist.`);
  }

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

startServer();
