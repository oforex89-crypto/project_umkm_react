import { useState, useEffect, useRef } from "react";
import { Store, MapPin, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { HeroSection } from "../components/HeroSection";
import { FeaturedSection } from "../components/FeaturedSection";
import { SpecialPackagesSection } from "../components/SpecialPackagesSection";
import { FoodStand } from "../types";
import { getImageUrl, getPlaceholderDataUrl, handleImageError } from "../utils/imageHelpers";
import { API_BASE_URL } from "../config/api";

export function HomePage() {
  const standsRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [umkmList, setUmkmList] = useState<FoodStand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUMKM();
  }, []);

  const loadUMKM = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/umkm`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        const apiStands: FoodStand[] = data.data.map((umkm: any) => {
          const products =
            umkm.products?.map((product: any) => {
              return {
                id: String(product.id),
                name: product.nama_produk,
                description: product.deskripsi,
                price: parseFloat(product.harga),
                image: getImageUrl(product.gambar, undefined, getPlaceholderDataUrl("Produk")),
                category: product.kategori || "Lainnya",
                stock: product.stok ?? 0,
                available: product.stok > 0,
              };
            }) || [];

          return {
            id: String(umkm.id),
            name: umkm.nama_toko,
            description: umkm.deskripsi || "Produk berkualitas dari UMKM lokal",
            category: umkm.kategori || umkm.category?.nama_kategori || "Lainnya",
            rating: parseFloat(umkm.rating) || 4.5,
            image: getImageUrl(umkm.foto_toko, undefined, getPlaceholderDataUrl(umkm.nama_toko)),
            menu: products,
            isActive: umkm.status === "active",
            owner: umkm.nama_pemilik,
            whatsapp: umkm.whatsapp,
            instagram: umkm.instagram,
            about: umkm.about_me,
          };
        });

        const activeStands = apiStands.filter((stand) => stand.isActive);
        setUmkmList(activeStands);
      } else {
        setUmkmList([]);
      }
    } catch (error) {
      console.error("Error loading UMKM:", error);
      setUmkmList([]);
    } finally {
      setLoading(false);
    }
  };

  const scrollToStands = () => {
    standsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEventClick = (eventId?: string) => {
    if (eventId) {
      navigate(`/events?eventId=${eventId}`);
    } else {
      navigate("/events");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <HeroSection
        onExplore={scrollToStands}
        onEventClick={() => handleEventClick()}
        onSlideClick={() => handleEventClick()}
      />
      <FeaturedSection />
      <SpecialPackagesSection />

      {/* UMKM List Section */}
      <section ref={standsRef} className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              UMKM Terdaftar
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Kenali lebih dekat UMKM lokal yang telah bergabung bersama kami
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
              <p className="text-gray-600 dark:text-gray-400 mt-4">Memuat UMKM...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {umkmList.map((umkm) => (
                  <div
                    key={umkm.id}
                    onClick={() => navigate(`/umkm/${umkm.id}`)}
                    className="bg-white dark:bg-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-600 hover:scale-105"
                  >
                    <div className="relative aspect-square bg-gray-200 dark:bg-gray-600 overflow-hidden">
                      <img
                        src={umkm.image}
                        alt={umkm.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => handleImageError(e, umkm.name)}
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-sm md:text-base text-gray-800 dark:text-white mb-1 line-clamp-1">
                        {umkm.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <Store className="w-3 h-3" />
                        <span className="line-clamp-1">{umkm.category}</span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                        {umkm.description}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                          {umkm.menu?.length || 0} Produk
                        </span>
                        <ArrowRight className="w-4 h-4 text-orange-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
                >
                  Lihat Semua Produk
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Siap Mendukung UMKM Lokal?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan pelanggan yang telah mendukung bisnis lokal
          </p>
          <button
            onClick={scrollToStands}
            className="bg-white text-orange-600 px-8 py-4 rounded-full font-semibold hover:bg-orange-50 transition-colors shadow-lg hover:shadow-xl"
          >
            Mulai Belanja Sekarang
          </button>
        </div>
      </section>
    </div>
  );
}
