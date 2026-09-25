import * as SunCalc from 'suncalc';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';

export interface AlpinTimeInfo {
  isDaytime: boolean;
  alpinHour: number; // 1 to 12
  progress: number; // 0 to 1
  hourName: string;
  hourDescription: string;
  hourSymbol: string;
  sunrise: Date;
  sunset: Date;
  yesterdaySunset: Date;
  tomorrowSunrise: Date;
  dayLengthMs: number;
  nightLengthMs: number;
  alpinHourLengthMs: number;
  remainingTimeMs: number;
  angle: number; // 0 to 360 degrees
  nextHourName: string;
}

export interface PrayerTimeInfo {
  name: string;
  time: Date;
  alpinHour: number;
  alpinMinute: number;
  alpinSecond: number;
  angle: number;
  symbol: string;
  description: string;
  isPassed: boolean;
}

const DAYTIME_HOURS = [
  {
    index: 1,
    name: "Gündoğumu (Evvel-i Gün)",
    symbol: "🌅",
    description: "Yeni günün başlangıcı, uyanış ve taze ışıklar.",
  },
  {
    index: 2,
    name: "Kuşluk (Zaman-ı İbadet)",
    symbol: "🌤️",
    description: "Güneşin yükseldiği, gölgelerin kısaldığı taze vakit.",
  },
  {
    index: 3,
    name: "Berrak Zihin (Talih Vakti)",
    symbol: "✍️",
    description: "Zihnin en berrak olduğu, çalışma ve odaklanma saati.",
  },
  {
    index: 4,
    name: "Yükseliş (Gayret Saati)",
    symbol: "⚒️",
    description: "Güneşin gücünü hissettirdiği verimli üretim zamanı.",
  },
  {
    index: 5,
    name: "Zirve Öncesi (Mesaî)",
    symbol: "🧭",
    description: "Günün ortasına yaklaşırken zirve öncesi son hazırlık.",
  },
  {
    index: 6,
    name: "Zirve (Nısfü'n-Nehâr)",
    symbol: "☀️",
    description: "Öğle vakti. Güneş göğün en yüksek noktasında, gölgeler en kısa.",
  },
  {
    index: 7,
    name: "Denge (Zeval Vakti)",
    symbol: "⚖️",
    description: "Günün iki yarısı arasındaki dönüm noktası, dinginlik.",
  },
  {
    index: 8,
    name: "Alçalma (Durgunluk Saati)",
    symbol: "🌡️",
    description: "Sıcaklığın en yoğun hissedildiği ama ışığın hafifçe eğildiği vakit.",
  },
  {
    index: 9,
    name: "İkindi (Gölge Vakti)",
    symbol: "👥",
    description: "Gölgelerin boyunun uzamaya başladığı, serinleme vakti.",
  },
  {
    index: 10,
    name: "Süzülme (Huzur Vakti)",
    symbol: "🌾",
    description: "Günün telaşının bittiği, doğanın yavaş yavaş durulduğu an.",
  },
  {
    index: 11,
    name: "Akşamüstü (Kavuşma Saati)",
    symbol: "🌇",
    description: "Güneşin ufka yaklaştığı, kızıllığın göğü kapladığı an.",
  },
  {
    index: 12,
    name: "Gurub (Akşam Alacakaranlığı)",
    symbol: "🪁",
    description: "Güneşin batış anı, gündüzün vedası ve geceye geçiş.",
  },
];

const NIGHTTIME_HOURS = [
  {
    index: 1,
    name: "Şafak Sonrası (Yatsı)",
    symbol: "🌌",
    description: "Karanlığın çöküşü, günün muhasebesi ve ilk sessizlik.",
  },
  {
    index: 2,
    name: "Gece Perdesi (Sükût)",
    symbol: "🕯️",
    description: "Gökyüzünün yıldızlarla kaplandığı, derin iç huzur.",
  },
  {
    index: 3,
    name: "Uykunun Eşiği (İstirahat)",
    symbol: "💤",
    description: "Bedenin ve ruhun dinlenmeye çekildiği arınma vakti.",
  },
  {
    index: 4,
    name: "Gece Yarısına Doğru (Rüya)",
    symbol: "🔮",
    description: "Bilinçaltının kapılarının açıldığı rüya zamanı.",
  },
  {
    index: 5,
    name: "Derin Sessizlik (Sır Vakti)",
    symbol: "🦉",
    description: "Dünyanın en sessiz olduğu, mistik fısıltılar saati.",
  },
  {
    index: 6,
    name: "Gece Yarısı (Nısfü'l-Leyl)",
    symbol: "🌙",
    description: "Gecenin en karanlık ve en derin anı, dönüşüm noktası.",
  },
  {
    index: 7,
    name: "Kozmik Saat (Yıldız Saati)",
    symbol: "✨",
    description: "Evrenin sonsuzluğunun en belirgin olduğu tefekkür vakti.",
  },
  {
    index: 8,
    name: "Uyanış Öncesi (Sessiz Nöbet)",
    symbol: "🥶",
    description: "Gecenin en soğuk, en sakin ama aydınlığa en yakın anı.",
  },
  {
    index: 9,
    name: "Seher Vakti (Tecelli)",
    symbol: "🌬️",
    description: "Tan yerinin ağarmasından önceki en bereketli ve ilham dolu vakit.",
  },
  {
    index: 10,
    name: "Şafak Belirtisi (Fecr-i Kâzib)",
    symbol: "🕯️",
    description: "Ufukta ilk yalancı aydınlığın belirdiği uyanış müjdesi.",
  },
  {
    index: 11,
    name: "Alacakaranlık (Fecr-i Sadık)",
    symbol: "🕊️",
    description: "Gökyüzünün maviye boyandığı, kuşların ilk cıvıltıları.",
  },
  {
    index: 12,
    name: "Gündönümü (Sabah Alacakaranlığı)",
    symbol: "🐓",
    description: "Güneşin doğmak üzere olduğu, gecenin gündüze teslimiyeti.",
  },
];

export function getAlpinTime(date: Date, latitude: number, longitude: number): AlpinTimeInfo {
  const currentMs = date.getTime();

  // Get solar times for today
  const todayTimes = SunCalc.getTimes(date, latitude, longitude);
  
  // Safely fallback if sunrise/sunset is not available (e.g. Polar Day/Night)
  const sunriseToday = todayTimes.sunrise && !isNaN(todayTimes.sunrise.getTime()) 
    ? todayTimes.sunrise 
    : (() => {
        const d = new Date(date);
        d.setHours(6, 0, 0, 0);
        return d;
      })();

  const sunsetToday = todayTimes.sunset && !isNaN(todayTimes.sunset.getTime()) 
    ? todayTimes.sunset 
    : (() => {
        const d = new Date(date);
        d.setHours(18, 0, 0, 0);
        return d;
      })();

  // Get solar times for tomorrow
  const tomorrow = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowTimes = SunCalc.getTimes(tomorrow, latitude, longitude);
  const sunriseTomorrow = tomorrowTimes.sunrise && !isNaN(tomorrowTimes.sunrise.getTime()) 
    ? tomorrowTimes.sunrise 
    : (() => {
        const d = new Date(tomorrow);
        d.setHours(6, 0, 0, 0);
        return d;
      })();

  // Get solar times for yesterday
  const yesterday = new Date(date.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayTimes = SunCalc.getTimes(yesterday, latitude, longitude);
  const sunsetYesterday = yesterdayTimes.sunset && !isNaN(yesterdayTimes.sunset.getTime()) 
    ? yesterdayTimes.sunset 
    : (() => {
        const d = new Date(yesterday);
        d.setHours(18, 0, 0, 0);
        return d;
      })();

  let isDaytime = false;
  let startMs = 0;
  let endMs = 0;

  if (currentMs >= sunriseToday.getTime() && currentMs < sunsetToday.getTime()) {
    isDaytime = true;
    startMs = sunriseToday.getTime();
    endMs = sunsetToday.getTime();
  } else if (currentMs >= sunsetToday.getTime()) {
    isDaytime = false;
    startMs = sunsetToday.getTime();
    endMs = sunriseTomorrow.getTime();
  } else {
    // Before sunrise today (early morning, night of yesterday)
    isDaytime = false;
    startMs = sunsetYesterday.getTime();
    endMs = sunriseToday.getTime();
  }

  const durationMs = endMs - startMs;
  const elapsedMs = currentMs - startMs;

  const alpinHourDurationMs = durationMs / 12;
  const floatHour = elapsedMs / alpinHourDurationMs;
  let alpinHour = Math.floor(floatHour) + 1;
  if (alpinHour > 12) alpinHour = 12;
  if (alpinHour < 1) alpinHour = 1;

  const progress = floatHour - (alpinHour - 1);
  const remainingTimeMs = Math.max(0, (alpinHour * alpinHourDurationMs) - elapsedMs);

  // Get metadata
  const hoursArray = isDaytime ? DAYTIME_HOURS : NIGHTTIME_HOURS;
  const hourData = hoursArray[alpinHour - 1];
  const nextHourIndex = alpinHour < 12 ? alpinHour : 0;
  const nextHourArray = nextHourIndex === 0 ? (isDaytime ? NIGHTTIME_HOURS : DAYTIME_HOURS) : hoursArray;
  const nextHourData = nextHourIndex === 0 ? nextHourArray[0] : nextHourArray[nextHourIndex];

  // Calculate angle for the clock face
  // Sunrise starts at 270 degrees.
  // Day hours 1..12 move from 270 to 90 degrees (180 degrees total arc).
  // Night hours 1..12 move from 90 to 270 degrees (180 degrees total arc).
  let angle = 0;
  if (isDaytime) {
    const totalDayElapsedHours = alpinHour - 1 + progress; // 0 to 12
    angle = (270 + totalDayElapsedHours * 15) % 360;
  } else {
    const totalNightElapsedHours = alpinHour - 1 + progress; // 0 to 12
    angle = (90 + totalNightElapsedHours * 15) % 360;
  }

  return {
    isDaytime,
    alpinHour,
    progress,
    hourName: hourData.name,
    hourDescription: hourData.description,
    hourSymbol: hourData.symbol,
    sunrise: sunriseToday,
    sunset: sunsetToday,
    yesterdaySunset: sunsetYesterday,
    tomorrowSunrise: sunriseTomorrow,
    dayLengthMs: sunsetToday.getTime() - sunriseToday.getTime(),
    nightLengthMs: sunriseTomorrow.getTime() - sunsetToday.getTime(),
    alpinHourLengthMs: alpinHourDurationMs,
    remainingTimeMs,
    angle,
    nextHourName: nextHourData.name,
  };
}

export function formatMsToTimeStr(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours} sa`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes} dk`);
  parts.push(`${seconds} sn`);

  return parts.join(' ');
}

// City presets in Turkey and major celestial extreme cases
export interface CityPreset {
  name: string;
  lat: number;
  lng: number;
  description: string;
}

export const CITY_PRESETS: CityPreset[] = [
  { name: "İstanbul", lat: 41.0082, lng: 28.9784, description: "Doğu ile Batı'nın buluştuğu tarihi metropol." },
  { name: "Ankara", lat: 39.9334, lng: 32.8597, description: "Anadolu'nun kalbi, Türkiye'nin başkenti." },
  { name: "İzmir", lat: 38.4192, lng: 27.1287, description: "Ege'nin incisi, güneşin en güzel battığı yerlerden." },
  { name: "Antalya", lat: 36.8969, lng: 30.7133, description: "Akdeniz'in sıcak güneşiyle yıkanan kıyılar." },
  { name: "Trabzon", lat: 41.0027, lng: 39.7168, description: "Karadeniz'in yeşil ve mavi tonlarındaki incisi." },
  { name: "Erzurum", lat: 39.9056, lng: 41.2758, description: "Yüksek rakımda güneşin keskin doğuşu." },
  { name: "Mekke", lat: 21.3891, lng: 39.8579, description: "Ekvatora yakın, gece gündüz farkı az olan kutsal şehir." },
  { name: "Tromsø (Kutup Dairesi)", lat: 69.6492, lng: 18.9553, description: "Gece yarısı güneşi ve kutup gecelerinin yaşandığı ekstrem nokta." },
  { name: "Londra", lat: 51.5074, lng: -0.1278, description: "Kuzey Avrupa'da mevsimsel gün uzunluğu farkları belirgin bir merkez." },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503, description: "Güneşin doğduğu ülkenin modern başkenti." },
];

export function getIslamicPrayerTimes(
  date: Date,
  latitude: number,
  longitude: number
): PrayerTimeInfo[] {
  const coords = new Coordinates(latitude, longitude);
  let params;
  try {
    params = CalculationMethod.Turkey();
  } catch (e) {
    params = CalculationMethod.MuslimWorldLeague();
    params.fajrAngle = 18.0;
    params.ishaAngle = 17.0;
  }

  const pTimes = new PrayerTimes(coords, date, params);

  const prayers = [
    { name: "İmsak", time: pTimes.fajr, symbol: "🌌", description: "Yeme içmenin kesildiği, sabah namazı vaktinin girdiği an." },
    { name: "Güneş", time: pTimes.sunrise, symbol: "🌅", description: "Güneşin doğduğu, sabah namazı vaktinin çıktığı an." },
    { name: "Öğle", time: pTimes.dhuhr, symbol: "☀️", description: "Güneşin tepe noktasını geçip gölgenin uzamaya başladığı an." },
    { name: "İkindi", time: pTimes.asr, symbol: "👥", description: "Her şeyin gölgesinin kendisi veya iki katı kadar olduğu an." },
    { name: "Akşam", time: pTimes.maghrib, symbol: "🌇", description: "Güneşin battığı, akşam namazı ve oruç açma vakti." },
    { name: "Yatsı", time: pTimes.isha, symbol: "🌙", description: "Batı ufkundaki kızıllık veya beyazlığın kaybolduğu an." },
  ];

  const nowMs = date.getTime();

  return prayers.map((p) => {
    const alpin = getAlpinTime(p.time, latitude, longitude);
    const alpinMinute = Math.floor(alpin.progress * 60);
    const alpinSecond = Math.floor((alpin.progress * 60 % 1) * 60);

    return {
      name: p.name,
      time: p.time,
      alpinHour: alpin.alpinHour,
      alpinMinute,
      alpinSecond,
      angle: alpin.angle,
      symbol: p.symbol,
      description: p.description,
      isPassed: p.time.getTime() < nowMs,
    };
  });
}
