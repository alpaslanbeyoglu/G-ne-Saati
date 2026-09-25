import { useState, useEffect, useRef } from "react";
import { 
  Sun, 
  Moon, 
  Compass, 
  Calendar, 
  MapPin, 
  Info, 
  Settings, 
  RotateCcw, 
  Sparkles, 
  ArrowRight,
  Maximize2,
  Minimize2,
  ChevronRight,
  ChevronLeft
} from "lucide-react";
import { 
  getAlpinTime, 
  formatMsToTimeStr, 
  CITY_PRESETS, 
  CityPreset, 
  AlpinTimeInfo,
  getIslamicPrayerTimes,
  PrayerTimeInfo
} from "./utils/solarCalculations";

export default function App() {
  // State for location
  const [lat, setLat] = useState<number>(41.0082); // Default to Istanbul
  const [lng, setLng] = useState<number>(28.9784);
  const [cityName, setCityName] = useState<string>("İstanbul");
  const [geoLoading, setGeoLoading] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // State for date and time travel
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const [timeSliderVal, setTimeSliderVal] = useState<number>(0); // 0 to 1439 (minutes of the day)

  // Sidebar / panel control states
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // Gemini philosophy state
  const [philosophyText, setPhilosophyText] = useState<string>("");
  const [philosophyLoading, setPhilosophyLoading] = useState<boolean>(false);
  const [philosophyError, setPhilosophyError] = useState<string | null>(null);

  // Local storage for user's location setting
  useEffect(() => {
    const savedLat = localStorage.getItem("alpin_lat");
    const savedLng = localStorage.getItem("alpin_lng");
    const savedCity = localStorage.getItem("alpin_city");
    if (savedLat && savedLng) {
      setLat(parseFloat(savedLat));
      setLng(parseFloat(savedLng));
      if (savedCity) setCityName(savedCity);
    }
  }, []);

  // Update slider value when selectedDate changes (only in non-live mode)
  useEffect(() => {
    if (!isLiveMode) {
      const minutes = selectedDate.getHours() * 60 + selectedDate.getMinutes();
      setTimeSliderVal(minutes);
    }
  }, [selectedDate, isLiveMode]);

  // Clock ticking effect
  useEffect(() => {
    if (!isLiveMode) return;

    const timer = setInterval(() => {
      setSelectedDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [isLiveMode]);

  // Current calculated Alpin Time Info
  const alpinInfo: AlpinTimeInfo = getAlpinTime(selectedDate, lat, lng);

  // Calculated Islamic prayer times for this date & location
  const prayerTimes: PrayerTimeInfo[] = getIslamicPrayerTimes(selectedDate, lat, lng);

  // Dynamic Alpin minutes and seconds calculation
  const alpinMinute = Math.floor(alpinInfo.progress * 60);
  const alpinSecond = Math.floor((alpinInfo.progress * 60 % 1) * 60);
  const formattedAlpinMinute = alpinMinute.toString().padStart(2, "0");
  const formattedAlpinSecond = alpinSecond.toString().padStart(2, "0");

  // Handle location preset selection
  const selectCityPreset = (city: CityPreset) => {
    setLat(city.lat);
    setLng(city.lng);
    setCityName(city.name);
    localStorage.setItem("alpin_lat", city.lat.toString());
    localStorage.setItem("alpin_lng", city.lng.toString());
    localStorage.setItem("alpin_city", city.name);
  };

  // Detect live browser location
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Tarayıcınız konum servislerini desteklemiyor.");
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const roundedLat = Math.round(position.coords.latitude * 10000) / 10000;
        const roundedLng = Math.round(position.coords.longitude * 10000) / 10000;
        setLat(roundedLat);
        setLng(roundedLng);
        setCityName("Mevcut Konumunuz");
        setGeoLoading(false);
        localStorage.setItem("alpin_lat", roundedLat.toString());
        localStorage.setItem("alpin_lng", roundedLng.toString());
        localStorage.setItem("alpin_city", "Mevcut Konumunuz");
      },
      (error) => {
        console.error(error);
        setGeoLoading(false);
        setGeoError("Konum izni reddedildi veya konum alınamadı.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle time travel slider change
  const handleTimeSliderChange = (val: number) => {
    setIsLiveMode(false);
    setTimeSliderVal(val);
    const updatedDate = new Date(selectedDate);
    const hrs = Math.floor(val / 60);
    const mins = val % 60;
    updatedDate.setHours(hrs);
    updatedDate.setMinutes(mins);
    updatedDate.setSeconds(0);
    setSelectedDate(updatedDate);
  };

  // Set to special celestial seasonal events
  const setSeasonShortcut = (type: "summer" | "winter" | "spring_equinox" | "fall_equinox") => {
    setIsLiveMode(false);
    const year = selectedDate.getFullYear();
    const updated = new Date(selectedDate);
    if (type === "summer") {
      updated.setMonth(5); // June
      updated.setDate(21); // Solstice
    } else if (type === "winter") {
      updated.setMonth(11); // December
      updated.setDate(21); // Solstice
    } else if (type === "spring_equinox") {
      updated.setMonth(2); // March
      updated.setDate(21); // Equinox
    } else if (type === "fall_equinox") {
      updated.setMonth(8); // September
      updated.setDate(23); // Equinox
    }
    setSelectedDate(updated);
  };

  // Generate Gemini-powered philosophy
  const fetchPhilosophy = async () => {
    setPhilosophyLoading(true);
    setPhilosophyError(null);
    setPhilosophyText("");

    try {
      const response = await fetch("/api/philosophy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alpinHour: alpinInfo.alpinHour,
          isDaytime: alpinInfo.isDaytime,
          hourName: alpinInfo.hourName,
          hourDescription: alpinInfo.hourDescription,
          latitude: lat,
          longitude: lng,
          cityName: cityName,
          dateString: selectedDate.toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric"
          })
        }),
      });

      if (!response.ok) {
        throw new Error("Sunucudan yanıt alınamadı.");
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setPhilosophyText(data.philosophy);
    } catch (err: any) {
      console.error(err);
      setPhilosophyError(err.message || "Bir hata oluştu.");
    } finally {
      setPhilosophyLoading(false);
    }
  };

  // Human standard time string formatting
  const standardTimeStr = selectedDate.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  // Sunrise / Sunset formatted strings
  const sunriseStr = alpinInfo.sunrise.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const sunsetStr = alpinInfo.sunset.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  // Duration calculations
  const dayLengthMins = Math.round(alpinInfo.dayLengthMs / 1000 / 60);
  const nightLengthMins = Math.round(alpinInfo.nightLengthMs / 1000 / 60);
  const dayAlpinHourLenMins = (alpinInfo.dayLengthMs / 12 / 1000 / 60).toFixed(1);
  const nightAlpinHourLenMins = (alpinInfo.nightLengthMs / 12 / 1000 / 60).toFixed(1);

  // Active duration info
  const activeAlpinHourMins = (alpinInfo.alpinHourLengthMs / 1000 / 60).toFixed(1);

  // Clock sectors details (1 to 24)
  // Generating exact SVG arc lines for unequal sectors
  const renderSectors = () => {
    const sectors = [];
    // Day Sectors: 12 segments on top half, spanning from 270 deg to 90 deg clockwise (180 deg total).
    // So each segment is exactly 15 deg.
    for (let i = 0; i < 12; i++) {
      const startAngle = 270 + i * 15;
      const endAngle = startAngle + 15;
      const textAngle = startAngle + 7.5;
      sectors.push({
        isDay: true,
        num: i + 1,
        startAngle,
        endAngle,
        textAngle,
        symbol: ["🌅", "🌤️", "✍️", "⚒️", "🧭", "☀️", "⚖️", "🌡️", "👥", "🌾", "🌇", "🪁"][i],
        roman: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"][i],
      });
    }
    // Night Sectors: 12 segments on bottom half, spanning from 90 deg to 270 deg clockwise (180 deg total).
    for (let i = 0; i < 12; i++) {
      const startAngle = 90 + i * 15;
      const endAngle = startAngle + 15;
      const textAngle = startAngle + 7.5;
      sectors.push({
        isDay: false,
        num: i + 1,
        startAngle,
        endAngle,
        textAngle,
        symbol: ["🌌", "🕯️", "💤", "🔮", "🦉", "🌙", "✨", "🥶", "🌬️", "🕯️", "🕊️", "🐓"][i],
        roman: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"][i],
      });
    }
    return sectors;
  };

  const sectors = renderSectors();

  // Helper to convert polar coordinates to Cartesian for SVG path drawing
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  // Generates a wedge-shaped SVG path
  const drawWedgePath = (x: number, y: number, rIn: number, rOut: number, startAngle: number, endAngle: number) => {
    const startIn = polarToCartesian(x, y, rIn, startAngle);
    const endIn = polarToCartesian(x, y, rIn, endAngle);
    const startOut = polarToCartesian(x, y, rOut, startAngle);
    const endOut = polarToCartesian(x, y, rOut, endAngle);

    const arcSweep = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      `M ${startOut.x} ${startOut.y}`,
      `A ${rOut} ${rOut} 0 ${arcSweep} 1 ${endOut.x} ${endOut.y}`,
      `L ${endIn.x} ${endIn.y}`,
      `A ${rIn} ${rIn} 0 ${arcSweep} 0 ${startIn.x} ${startIn.y}`,
      "Z",
    ].join(" ");
  };

  return (
    <div className={`min-h-screen text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif] transition-all duration-700 bg-linear-to-b ${
      alpinInfo.isDaytime 
        ? "from-[#080d1a] via-[#101b38] to-[#1c1d2e]" 
        : "from-[#02050c] via-[#070b16] to-[#0d121f]"
    }`}>
      
      {/* Dynamic Cosmic Background Ornaments */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl transition-opacity duration-1000" 
             style={{ opacity: alpinInfo.isDaytime ? 0.6 : 0.1 }} />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#3b82f6]/10 blur-3xl transition-opacity duration-1000" 
             style={{ opacity: alpinInfo.isDaytime ? 0.2 : 0.6 }} />
        {/* Sky Constellations / Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.015)_1px,_transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Header Contract */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-black/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl font-['Cinzel',serif] font-bold tracking-widest text-amber-400">
            ALPIN GÜNEŞ SAATİ
          </span>
          <span className="h-4 w-px bg-white/10" />
          <span className="text-xs text-slate-400 tracking-wider">Tarihsel Unequal Hour Replike</span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsAboutOpen(!isAboutOpen)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
            title="Sistem Açıklaması ve Bilgi"
          >
            <Info size={19} />
          </button>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 rounded-md transition-all whitespace-nowrap"
          >
            <Settings size={14} />
            <span>{isSidebarOpen ? "Paneli Gizle" : "Ayarlar ve Keşfet"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* About / Info Overlay Drawer */}
        {isAboutOpen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-lg z-50 p-6 md:p-12 flex flex-col justify-start overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h2 className="text-2xl font-['Cinzel',serif] font-bold text-amber-400 flex items-center gap-2">
                  <Sun className="animate-spin-slow text-amber-400" /> Alpin Güneş Saati Nedir?
                </h2>
                <button 
                  onClick={() => setIsAboutOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-md bg-white/10 hover:bg-white/20 transition-colors"
                >
                  Kapat
                </button>
              </div>

              <div className="text-slate-300 space-y-4 text-sm md:text-base leading-relaxed">
                <p>
                  <strong>Alpin Güneş Saati (Mevsimsel / Eşit Olmayan Saatler)</strong>, antik çağlardan Orta Çağ sonlarına kadar tüm insanlığın kullandığı doğal zaman ölçüm metodudur. Bu sistemde, mekanik saatlerin dayattığı "her saatin sabit 60 dakika olması" kuralı geçerli değildir.
                </p>
                <p>
                  Bunun yerine doğanın kendi ritmine uyulur:
                </p>
                <ul className="list-disc list-inside pl-4 space-y-2 text-slate-300">
                  <li>
                    <span className="text-amber-400 font-semibold">Gündüz Periyodu</span> (Gün Doğumundan Gün Batımına) tam olarak <strong>12 eşit Alpin saatine</strong> bölünür.
                  </li>
                  <li>
                    <span className="text-[#3b82f6] font-semibold">Gece Periyodu</span> (Gün Batımından bir sonraki Gün Doğumuna) yine tam olarak <strong>12 eşit Alpin saatine</strong> bölünür.
                  </li>
                </ul>
                <p>
                  Bu sebeple, <strong>Yaz mevsiminde</strong> gündüzler çok uzun olduğundan, 1 Gündüz Alpin saati 60 dakikadan çok daha uzun sürer (örn. 75-80 dakika). Geceler ise kısa olduğundan 1 Gece Alpin saati çok kısadır (örn. 40-45 dakika). 
                  <strong>Kış mevsiminde</strong> ise tam tersi gerçekleşir. Sadece <strong>Ekinokslarda</strong> (21 Mart & 23 Eylül) gündüz ve gece Alpin saatleri birbirine eşitlenir ve tam olarak 60 dakika sürer.
                </p>
                <p className="text-slate-400 italic">
                  Ekranda göreceğiniz harikulade analog kadran, sol taraftan (saat 9 yönü) Güneşin Doğuşuyla başlar, tepe noktasında Gün Ortasına ulaşır, sağ tarafta (saat 3 yönü) batar ve alt yarıyı tamamlayarak Gece Yarısından geçip tekrar doğuşa ulaşır. Kadran üzerindeki ibre, seçtiğiniz konuma ve yılın gününe göre güneşin gökyüzündeki kozmik konumunu tam olarak yansıtmaktadır.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Left Side: Celestial Clock Area (Primary Focus) */}
        <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative">
          
          {/* Zen Title and Status Display */}
          <div className="text-center mb-4 md:mb-6 max-w-lg">
            <span className="text-xs uppercase tracking-[0.3em] font-medium text-amber-500/90 block mb-1">
              {alpinInfo.isDaytime ? "GÜNDÜZ PERİYODU" : "GECE PERİYODU"} · {cityName}
            </span>
            <h1 className="text-2xl md:text-4xl font-['Cinzel',serif] font-bold tracking-wide text-white drop-shadow-lg leading-tight">
              {alpinInfo.alpinHour}. Saat: {alpinInfo.hourName}
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-2 italic px-4">
              &ldquo;{alpinInfo.hourDescription}&rdquo;
            </p>
          </div>

          {/* Majestic Interactive Solar Clock Face */}
          <div className="relative w-[320px] h-[320px] xs:w-[350px] xs:h-[350px] md:w-[480px] md:h-[480px] rounded-full flex items-center justify-center transition-all duration-700 bg-linear-to-tr from-slate-900/40 to-slate-950/60 p-2 md:p-4 border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.6)]">
            
            {/* Hour Progress Outer Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="47.5" 
                className="stroke-white/5 fill-transparent" 
                strokeWidth="1.2" 
              />
              <circle 
                cx="50" 
                cy="50" 
                r="47.5" 
                className={`fill-transparent transition-all duration-1000 ${
                  alpinInfo.isDaytime ? "stroke-amber-500" : "stroke-blue-500"
                }`} 
                strokeWidth="1.6" 
                strokeDasharray="298.4"
                strokeDashoffset={298.4 - (298.4 * alpinInfo.progress)}
                strokeLinecap="round"
                style={{ filter: alpinInfo.isDaytime ? "drop-shadow(0 0 4px rgba(245,158,11,0.4))" : "drop-shadow(0 0 4px rgba(59,130,246,0.4))" }}
              />
            </svg>

            {/* Core Clock Face Inner SVG */}
            <svg className="w-full h-full" viewBox="0 0 400 400">
              {/* Radial Center Guide and Outer Border */}
              <circle cx="200" cy="200" r="185" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

              {/* Day / Night Division Gradients Background on dial */}
              {/* Top Half (Day: 270 to 90 degrees) */}
              <path 
                d="M 50 200 A 150 150 0 0 1 350 200 Z" 
                fill="url(#dayGrad)" 
                className="opacity-20 transition-opacity duration-1000"
              />
              {/* Bottom Half (Night: 90 to 270 degrees) */}
              <path 
                d="M 350 200 A 150 150 0 0 1 50 200 Z" 
                fill="url(#nightGrad)" 
                className="opacity-20 transition-opacity duration-1000"
              />

              <defs>
                <radialGradient id="dayGrad" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="nightGrad" cx="50%" cy="70%" r="50%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Draw 24 unequal sectors with tick marks & roman hour labels */}
              {sectors.map((sector, index) => {
                // Calculate position for hour labels
                const textPos = polarToCartesian(200, 200, 164, sector.textAngle);
                const tickInner = polarToCartesian(200, 200, 172, sector.startAngle);
                const tickOuter = polarToCartesian(200, 200, 182, sector.startAngle);

                // Highlight active sector
                const isActive = (sector.isDay === alpinInfo.isDaytime) && (sector.num === alpinInfo.alpinHour);

                return (
                  <g key={`sec-${index}`} className="transition-all duration-300">
                    {/* Tick Line */}
                    <line 
                      x1={tickInner.x} 
                      y1={tickInner.y} 
                      x2={tickOuter.x} 
                      y2={tickOuter.y} 
                      stroke={
                        sector.startAngle === 90 || sector.startAngle === 270
                          ? "rgba(251,191,36,0.8)" // Sunset/Sunrise line
                          : isActive 
                            ? (sector.isDay ? "#f59e0b" : "#3b82f6")
                            : "rgba(255,255,255,0.15)"
                      }
                      strokeWidth={sector.startAngle % 90 === 0 ? "2.5" : "1"}
                    />

                    {/* Sector Arc Highlight (Only for Active Hour) */}
                    {isActive && (
                      <path 
                        d={drawWedgePath(200, 200, 140, 185, sector.startAngle, sector.endAngle)}
                        fill={sector.isDay ? "rgba(245,158,11,0.06)" : "rgba(59,130,246,0.04)"}
                        stroke={sector.isDay ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.1)"}
                        strokeWidth="0.5"
                      />
                    )}

                    {/* Standard Hour Number */}
                    <text
                      x={textPos.x}
                      y={textPos.y + 4}
                      fill={
                        isActive 
                          ? (sector.isDay ? "#f59e0b" : "#60a5fa") 
                          : sector.isDay 
                            ? "rgba(253,186,116,0.4)" 
                            : "rgba(147,197,253,0.3)"
                      }
                      fontSize={isActive ? "13" : "10"}
                      fontWeight={isActive ? "700" : "500"}
                      textAnchor="middle"
                      className="cursor-default select-none transition-all duration-300 font-sans"
                    >
                      {sector.roman}
                    </text>
                  </g>
                );
              })}

              {/* İslami Namaz Vakitleri Göstergeleri */}
              {prayerTimes.map((prayer, pIdx) => {
                const markerPos = polarToCartesian(200, 200, 134, prayer.angle);
                const labelPos = polarToCartesian(200, 200, 118, prayer.angle);
                
                return (
                  <g key={`prayer-marker-${pIdx}`} className="group cursor-pointer">
                    <title>{`${prayer.name}: ${prayer.time.toLocaleTimeString("tr-TR", {hour: "2-digit", minute: "2-digit"})} (Alpin Saat: ${prayer.alpinHour}:${prayer.alpinMinute.toString().padStart(2, '0')})`}</title>
                    
                    {/* Guideline from center */}
                    <line 
                      x1="200" 
                      y1="200" 
                      x2={markerPos.x} 
                      y2={markerPos.y} 
                      stroke="rgba(16, 185, 129, 0.25)" 
                      strokeWidth="1.2" 
                      strokeDasharray="2,3" 
                    />

                    {/* Glowing dot representing the prayer time on the sky dial */}
                    <circle 
                      cx={markerPos.x} 
                      cy={markerPos.y} 
                      r="5" 
                      fill="#10b981" 
                      className="transition-all duration-300 group-hover:scale-150"
                      style={{ filter: "drop-shadow(0 0 4px #10b981)" }}
                    />

                    {/* Small text acronym of the prayer time */}
                    <text
                      x={labelPos.x}
                      y={labelPos.y + 3}
                      fill="#10b981"
                      fontSize="9"
                      fontWeight="800"
                      textAnchor="middle"
                      className="select-none pointer-events-none opacity-85 group-hover:opacity-100 font-sans transition-all duration-300"
                    >
                      {prayer.name}
                    </text>
                  </g>
                );
              })}

              {/* Major Horizon Indicators: Sunrise (East / Left) & Sunset (West / Right) */}
              {/* Sunrise Indicator (Left - 270 degrees) */}
              <g transform="translate(14, 200)" className="cursor-default select-none">
                <text x="0" y="-12" fill="rgba(245,158,11,0.7)" fontSize="8" fontWeight="bold" textAnchor="start" letterSpacing="1">GÜN DOĞUMU</text>
                <text x="0" y="2" fill="rgba(255,255,255,0.5)" fontSize="10" className="font-mono" textAnchor="start">{sunriseStr}</text>
              </g>

              {/* Sunset Indicator (Right - 90 degrees) */}
              <g transform="translate(386, 200)" className="cursor-default select-none">
                <text x="0" y="-12" fill="rgba(239,68,68,0.7)" fontSize="8" fontWeight="bold" textAnchor="end" letterSpacing="1">GÜN BATIMI</text>
                <text x="0" y="2" fill="rgba(255,255,255,0.5)" fontSize="10" className="font-mono" textAnchor="end">{sunsetStr}</text>
              </g>

              {/* Center Ring & Celestial Node */}
              <circle cx="200" cy="200" r="32" fill="#040711" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <circle cx="200" cy="200" r="12" fill={alpinInfo.isDaytime ? "#f59e0b" : "#3b82f6"} 
                style={{ filter: alpinInfo.isDaytime ? "drop-shadow(0 0 8px #f59e0b)" : "drop-shadow(0 0 8px #3b82f6)" }}
              />

              {/* Outer Golden/Indigo Pointer Hand representing the Sun's Celestial Angle */}
              <g transform={`rotate(${alpinInfo.angle}, 200, 200)`}>
                {/* Pointer Line */}
                <line 
                  x1="200" 
                  y1="200" 
                  x2="200" 
                  y2="55" 
                  stroke={alpinInfo.isDaytime ? "url(#sunHand)" : "url(#moonHand)"} 
                  strokeWidth="3.5"
                  strokeLinecap="round" 
                />
                
                {/* Hand End Celestial Symbol */}
                <circle cx="200" cy="55" r="8" fill={alpinInfo.isDaytime ? "#fbbf24" : "#93c5fd"} stroke="#050814" strokeWidth="2" />
                {alpinInfo.isDaytime ? (
                  /* Mini Sun Rays in Hand */
                  <circle cx="200" cy="55" r="3" fill="#ffffff" />
                ) : (
                  /* Mini Moon detail */
                  <path d="M 198 52 A 4 4 0 0 0 202 58 A 3.5 3.5 0 0 1 198 52" fill="#ffffff" />
                )}
              </g>

              {/* SVG Gradients for Hands */}
              <defs>
                <linearGradient id="sunHand" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#d97706" stopOpacity="0.2" />
                  <stop offset="80%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="moonHand" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.2" />
                  <stop offset="80%" stopColor="#3b82f6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#93c5fd" />
                </linearGradient>
              </defs>
            </svg>

            {/* Float HUD inside the watch face */}
            <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
              <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">ALPIN GÜNEŞ</span>
              <span className={`text-2xl font-['Cinzel',serif] font-bold ${
                alpinInfo.isDaytime ? "text-amber-400" : "text-blue-400"
              }`}>
                {alpinInfo.hourSymbol} {alpinInfo.alpinHour}:{formattedAlpinMinute}:{formattedAlpinSecond}
              </span>
              <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">
                KALAN: {formatMsToTimeStr(alpinInfo.remainingTimeMs)}
              </span>
            </div>
          </div>

          {/* Real Standard Human Clock Indicator (Underneath - Small but clear) */}
          <div className="mt-6 md:mt-8 flex flex-col items-center">
            {/* The "Real Clock used by humans" */}
            <div className="bg-black/35 backdrop-blur-md border border-white/5 py-2.5 px-6 rounded-xl flex items-center gap-4 shadow-inner">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLiveMode ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium font-mono">
                  {isLiveMode ? "CANLI STANDART SAAT" : "SIMÜLASYON SAATİ"}
                </span>
              </div>
              <span className="h-4 w-px bg-white/10" />
              <span className="text-lg md:text-xl font-mono font-bold text-white tracking-widest tabular-nums">
                {standardTimeStr}
              </span>
              {!isLiveMode && (
                <button 
                  onClick={() => setIsLiveMode(true)}
                  className="ml-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 py-1 px-2.5 rounded-md border border-emerald-500/15 transition-all"
                >
                  <RotateCcw size={11} />
                  <span>Canlıya Dön</span>
                </button>
              )}
            </div>

            {/* Current Alpin hour description/progress */}
            <div className="mt-3 text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>Şu Anki Dilim: {activeAlpinHourMins} dk sürüyor</span>
              <span>·</span>
              <span>Sonraki: {alpinInfo.nextHourName}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Control & Calibration Sidebar Dashboard */}
        {isSidebarOpen && (
          <aside className="w-full lg:w-[380px] shrink-0 border-t lg:border-t-0 lg:border-l border-white/5 bg-black/20 backdrop-blur-md p-5 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/5">
            
            {/* Location Section */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Compass size={14} className="text-amber-500" /> 1. Konum Ayarı
                </h3>
                <button 
                  onClick={detectLocation}
                  disabled={geoLoading}
                  className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 transition-all flex items-center gap-1 bg-amber-400/5 hover:bg-amber-400/10 py-1 px-2 rounded border border-amber-400/15"
                >
                  <MapPin size={10} />
                  <span>{geoLoading ? "Alınıyor..." : "Konumumu Bul"}</span>
                </button>
              </div>

              {/* Selected location readout */}
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{cityName}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {lat.toFixed(4)}° N · {lng.toFixed(4)}° E
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">SOLAR BOYUT</span>
                  <span className="text-xs font-semibold text-amber-500 font-mono">UTC{lng >= 0 ? "+" : ""}{(lng / 15).toFixed(1)}</span>
                </div>
              </div>

              {geoError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">
                  {geoError}
                </div>
              )}

              {/* City Presets Grid */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {CITY_PRESETS.map((preset) => {
                  const isSelected = cityName === preset.name;
                  return (
                    <button
                      key={preset.name}
                      onClick={() => selectCityPreset(preset)}
                      className={`text-left p-2 rounded-lg text-xs transition-all border ${
                        isSelected 
                          ? "bg-amber-400/10 border-amber-400/35 text-amber-400 font-semibold" 
                          : "bg-white/5 border-transparent hover:bg-white/10 text-slate-300"
                      }`}
                    >
                      <div className="truncate">{preset.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono truncate">{preset.lat.toFixed(1)}°, {preset.lng.toFixed(1)}°</div>
                    </button>
                  );
                })}
              </div>

              {/* Fine-tune Coordinates Slider */}
              <div className="space-y-2 pt-1 border-t border-white/5 mt-2">
                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Enlem İnce Ayar:</span>
                  <span className="text-slate-200">{lat}° N</span>
                </div>
                <input 
                  type="range" 
                  min="-90" 
                  max="90" 
                  step="0.1"
                  value={lat} 
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setLat(parsed);
                    setCityName("Özel Enlem/Boylam");
                  }}
                  className="w-full accent-amber-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                />

                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Boylam İnce Ayar:</span>
                  <span className="text-slate-200">{lng}° E</span>
                </div>
                <input 
                  type="range" 
                  min="-180" 
                  max="180" 
                  step="0.1"
                  value={lng} 
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    setLng(parsed);
                    setCityName("Özel Enlem/Boylam");
                  }}
                  className="w-full accent-amber-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </section>

            {/* Time Travel and Solstices Section */}
            <section className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Calendar size={14} className="text-amber-500" /> 2. Zaman Yolculuğu & Mevsimler
              </h3>

              {/* Custom Date Input */}
              <div className="flex gap-2">
                <div className="relative flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    {selectedDate.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                  <input 
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        setIsLiveMode(false);
                        const newD = new Date(e.target.value);
                        // preserve hours/minutes
                        newD.setHours(selectedDate.getHours());
                        newD.setMinutes(selectedDate.getMinutes());
                        setSelectedDate(newD);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
              </div>

              {/* Time of Day Scrub Slider */}
              <div className="space-y-1.5 bg-white/5 p-3 rounded-xl border border-white/5">
                <div className="flex justify-between text-xs font-mono text-slate-300">
                  <span>Günün Saati (Sürgü):</span>
                  <span className="text-amber-400 font-bold">
                    {selectedDate.getHours().toString().padStart(2, '0')}:
                    {selectedDate.getMinutes().toString().padStart(2, '0')}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1439" 
                  value={timeSliderVal} 
                  onChange={(e) => handleTimeSliderChange(parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 italic">Sürgüyü hareket ettirdiğinizde otomatik olarak canlandırma duraklatılır.</p>
              </div>

              {/* Season Shortcuts Grid */}
              <div className="grid grid-cols-2 gap-1.5">
                <button 
                  onClick={() => setSeasonShortcut("summer")}
                  className="p-2 rounded-lg bg-white/5 hover:bg-amber-400/10 text-xs text-slate-300 hover:text-amber-400 border border-transparent hover:border-amber-400/20 text-left transition-all"
                >
                  <div className="font-semibold text-amber-400">Yaz Gündönümü</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">21 Haziran (En uzun gün)</div>
                </button>
                <button 
                  onClick={() => setSeasonShortcut("winter")}
                  className="p-2 rounded-lg bg-white/5 hover:bg-blue-400/10 text-xs text-slate-300 hover:text-blue-400 border border-transparent hover:border-blue-400/20 text-left transition-all"
                >
                  <div className="font-semibold text-blue-400">Kış Gündönümü</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">21 Aralık (En kısa gün)</div>
                </button>
                <button 
                  onClick={() => setSeasonShortcut("spring_equinox")}
                  className="p-2 rounded-lg bg-white/5 hover:bg-emerald-400/10 text-xs text-slate-300 hover:text-emerald-400 border border-transparent hover:border-emerald-400/20 text-left transition-all"
                >
                  <div className="font-semibold text-emerald-400">Bahar Ekinoksu</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">21 Mart (Gün/Gece eşit)</div>
                </button>
                <button 
                  onClick={() => setSeasonShortcut("fall_equinox")}
                  className="p-2 rounded-lg bg-white/5 hover:bg-orange-400/10 text-xs text-slate-300 hover:text-orange-400 border border-transparent hover:border-orange-400/20 text-left transition-all"
                >
                  <div className="font-semibold text-orange-400">Güz Ekinoksu</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">23 Eylül (Gün/Gece eşit)</div>
                </button>
              </div>
            </section>

            {/* İslami Namaz Vakitleri */}
            <section className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <span className="text-[#10b981]">🕌</span> 3. Namaz Vakitleri (Diyanet Uyumlu)
              </h3>

              <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2">
                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                  Seçtiğiniz konumdaki standart vakitler ve bu vakitlerin doğadaki karşılığı olan Alpin zamanları:
                </p>
                <div className="space-y-1.5">
                  {prayerTimes.map((prayer, pIdx) => {
                    const timeStr = prayer.time.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                    return (
                      <div 
                        key={`prayer-row-${pIdx}`} 
                        className={`flex items-center justify-between p-2 rounded-lg text-xs transition-all ${
                          prayer.isPassed 
                            ? "bg-white/2 opacity-50" 
                            : "bg-emerald-500/5 border border-emerald-500/10"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{prayer.symbol}</span>
                          <div>
                            <div className="font-semibold text-white">{prayer.name}</div>
                            <div className="text-[9px] text-slate-400 truncate max-w-[150px]">{prayer.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-amber-400">{timeStr}</div>
                          <div className="text-[10px] text-emerald-400 font-mono">
                            Alpin {prayer.alpinHour}:{prayer.alpinMinute.toString().padStart(2, '0')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Astronomical Telemetry */}
            <section className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Sun size={14} className="text-amber-500 animate-spin-slow" /> 4. Astronomik Veriler
              </h3>

              <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">🌅 Gün Doğumu:</span>
                  <span className="text-white font-semibold">{sunriseStr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">🌇 Gün Batımı:</span>
                  <span className="text-white font-semibold">{sunsetStr}</span>
                </div>
                <div className="h-px bg-white/5 my-1" />
                <div className="flex justify-between">
                  <span className="text-slate-400">☀️ Toplam Gündüz:</span>
                  <span className="text-amber-400 font-bold">{dayLengthMins} dk ({Math.round(dayLengthMins/60)} sa)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">🌙 Toplam Gece:</span>
                  <span className="text-blue-400 font-bold">{nightLengthMins} dk ({Math.round(nightLengthMins/60)} sa)</span>
                </div>
                <div className="h-px bg-white/5 my-1" />
                <div className="flex justify-between">
                  <span className="text-slate-400">📐 1 Gündüz Alpin Saati:</span>
                  <span className="text-amber-400 font-bold">{dayAlpinHourLenMins} dk</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">📐 1 Gece Alpin Saati:</span>
                  <span className="text-blue-400 font-bold">{nightAlpinHourLenMins} dk</span>
                </div>
              </div>
            </section>

            {/* AI Philosophy Component */}
            <section className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-400 animate-pulse" /> 5. Kozmik Zaman Felsefesi
                </h3>
              </div>

              <div className="p-4 rounded-xl bg-linear-to-b from-slate-900/60 to-slate-950/80 border border-white/10 space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Şu anki Alpin Saatinin ({alpinInfo.alpinHour}. Saat) kozmik, astronomik ve felsefi anlamını size fısıldaması için Gemini AI'yi tetikleyin.
                </p>

                {philosophyText && (
                  <div className="text-xs text-amber-100/90 leading-relaxed bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 italic font-serif">
                    &ldquo;{philosophyText}&rdquo;
                  </div>
                )}

                {philosophyError && (
                  <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/15">
                    {philosophyError}
                  </div>
                )}

                <button
                  onClick={fetchPhilosophy}
                  disabled={philosophyLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg transition-all"
                >
                  {philosophyLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Felsefe Fısıldanıyor...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Kozmik Felsefeyi Al</span>
                    </>
                  )}
                </button>
              </div>
            </section>

          </aside>
        )}

      </div>

      {/* Unboxed Footer: Legal and attribution */}
      <footer className="py-4 px-6 border-t border-white/5 bg-black/15 text-center text-xs text-slate-500 relative z-20 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>
          © 2026 Alpin Güneş Saati · Alpaslan Beyoğlu Özel Tasarım
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span>Enlem {lat.toFixed(2)}°</span>
          <span>·</span>
          <span>Boylam {lng.toFixed(2)}°</span>
          <span>·</span>
          <span>Tarih {selectedDate.toLocaleDateString("tr-TR")}</span>
        </div>
      </footer>

    </div>
  );
}
