import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { API_BASE_URL, BASE_HOST } from "../config/api";

interface HeroSectionProps {
  onExplore: () => void;
  onEventClick?: (eventId?: string) => void;
  onSlideClick?: (eventId?: string) => void;
}

interface Slide {
  id: number;
  eventId?: string;
  image: string;
  title: string;
  description: string;
  badge?: string;
  positionX?: number;
  positionY?: number;
  scale?: number;
}

export function HeroSection({
  onExplore,
  onEventClick,
  onSlideClick,
}: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([]);

  // Load events from API
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events`);
        const data = await response.json();

        if (data.success && Array.isArray(data.data)) {
          console.log("📅 Loading events for hero:", data.data);

          // Filter upcoming/ongoing events and map to slides
          const eventSlides: Slide[] = data.data
            .filter((evt: any) => {
              const eventDate = new Date(evt.date);
              const today = new Date();
              return eventDate >= today; // Only show future/today events
            })
            .map((evt: any, index: number) => {
              console.log(`Event "${evt.name}" image:`, evt.image);
              console.log(`Event "${evt.name}" position:`, evt.gambar_position_x, evt.gambar_position_y, 'scale:', evt.gambar_scale);

              // Determine badge
              const eventDate = new Date(evt.date);
              const today = new Date();
              const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              const badge = diffDays <= 7 ? "BERLANGSUNG" : "AKAN DATANG";

              // Handle image URL - check if external or local path
              let imageUrl = "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80";
              if (evt.image) {
                if (evt.image.startsWith('http://') || evt.image.startsWith('https://')) {
                  imageUrl = evt.image;
                } else {
                  imageUrl = `${BASE_HOST}/${evt.image}`;
                }
              }

              return {
                id: index + 1,
                eventId: evt.id,
                image: imageUrl,
                title: evt.name,
                description: evt.description,
                badge: badge,
                positionX: evt.gambar_position_x || 0,
                positionY: evt.gambar_position_y || 0,
                scale: evt.gambar_scale || 1,
              };
            });

          // If no events, use default slides
          if (eventSlides.length === 0) {
            setSlides([
              {
                id: 1,
                image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80",
                title: "Event & Bazar UMKM",
                description: "Lihat jadwal event dan bazar UMKM terkini. Klik untuk detail lengkap!",
                badge: "EVENT",
              },
              {
                id: 2,
                image: "https://images.unsplash.com/photo-1504674900152-b8b27e3dcbed?w=1920&q=80",
                title: "Festival Kuliner Nusantara",
                description: "Nikmati berbagai kuliner khas dari seluruh Indonesia",
                badge: "FESTIVAL",
              },
              {
                id: 3,
                image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80",
                title: "Pameran Produk Lokal",
                description: "Temukan produk berkualitas dari pelaku UMKM Indonesia",
                badge: "PAMERAN",
              },
            ]);
          } else {
            setSlides(eventSlides);
          }
        }
      } catch (error) {
        console.error('Error loading events for hero:', error);
        // Use default slides on error
        setSlides([
          {
            id: 1,
            image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1920&q=80",
            title: "Event & Bazar UMKM",
            description: "Lihat jadwal event dan bazar UMKM terkini. Klik untuk detail lengkap!",
            badge: "EVENT",
          },
          {
            id: 2,
            image: "https://images.unsplash.com/photo-1504674900152-b8b27e3dcbed?w=1920&q=80",
            title: "Festival Kuliner Nusantara",
            description: "Nikmati berbagai kuliner khas dari seluruh Indonesia",
            badge: "FESTIVAL",
          },
          {
            id: 3,
            image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=80",
            title: "Pameran Produk Lokal",
            description: "Temukan produk berkualitas dari pelaku UMKM Indonesia",
            badge: "PAMERAN",
          },
        ]);
      }
    };

    loadEvents();
  }, []);

  // Auto-play slideshow
  useEffect(() => {
    if (slides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const current = slides[currentSlide];

  if (slides.length === 0) {
    return null;
  }

  return (
    <section className="w-full px-0 py-8">
      <div
        className="relative h-[300px] sm:h-[400px] md:h-[500px] rounded-2xl mx-4 overflow-hidden shadow-2xl group cursor-pointer"
        onClick={() => onSlideClick?.(current.eventId)}
      >
        {/* Background Images */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? "opacity-100" : "opacity-0"
              }`}
          >
            <div className="w-full h-full overflow-hidden relative">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full"
                style={{
                  objectFit: 'cover',
                  objectPosition: `${slide.positionX || 0}px ${slide.positionY || 0}px`,
                  transform: `scale(${slide.scale || 1})`,
                }}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 500'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%239333ea'/%3E%3Cstop offset='100%25' style='stop-color:%234f46e5'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23grad)' width='1920' height='500'/%3E%3C/svg%3E";
                }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        ))}

        {/* Badge */}
        {current.badge && (
          <div className="absolute top-6 right-6 bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-full animate-pulse z-20 shadow-lg">
            {current.badge}
          </div>
        )}

        {/* Content */}
        <div className="absolute bottom-8 left-4 right-4 md:left-8 md:right-8 z-20">
          <h2 className="text-white text-xl sm:text-2xl md:text-4xl font-bold mb-2 md:mb-3 drop-shadow-lg line-clamp-2">
            {current.title}
          </h2>
          <p className="text-white/90 text-sm sm:text-base md:text-xl mb-3 md:mb-6 max-w-2xl drop-shadow-md line-clamp-2">
            {current.description}
          </p>
          <div className="text-white/80 text-xs sm:text-sm font-medium drop-shadow-md inline-block">
            Klik untuk melihat semua event →
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/60 text-white rounded-full p-3 transition z-20 shadow-lg opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft size={32} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/40 hover:bg-white/60 text-white rounded-full p-3 transition z-20 shadow-lg opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={32} />
        </button>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(index);
              }}
              className={`h-2 rounded-full transition-all shadow-lg ${index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75 w-2"
                }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
