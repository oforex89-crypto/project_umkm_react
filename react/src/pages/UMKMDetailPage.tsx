import { useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, MapPin, Phone, Instagram, Package, ChevronDown, ChevronUp, ShoppingCart, MessageCircle, Loader, Store, List, Filter } from "lucide-react";
import { FoodStand, Product } from "../types";
import { WhatsAppCheckoutModal } from "../components/WhatsAppCheckoutModal";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { API_BASE_URL, BASE_HOST } from "../config/api";

// Base URL without /api suffix for image URLs
const BASE_URL = BASE_HOST;

interface ExtendedFoodStand extends FoodStand {
    location?: string;
    namaBank?: string;
    noRekening?: string;
    atasNama?: string;
}

export function UMKMDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();

    const [umkm, setUmkm] = useState<ExtendedFoodStand | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllProducts, setShowAllProducts] = useState(false);
    const [buyNowProduct, setBuyNowProduct] = useState<Product | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("Semua Produk");
    const [sortOption, setSortOption] = useState<string>("Terbaru");

    // Get unique categories from products
    const categories = useMemo(() => {
        if (!umkm?.menu || umkm.menu.length === 0) return [];
        const cats = new Set<string>();
        umkm.menu.forEach(product => {
            if (product.category) {
                cats.add(product.category);
            }
        });
        return ["Semua Produk", ...Array.from(cats)];
    }, [umkm?.menu]);

    // Filter and sort products
    const filteredProducts = useMemo(() => {
        if (!umkm?.menu) return [];

        let products = [...umkm.menu];

        // Filter by category
        if (selectedCategory !== "Semua Produk") {
            products = products.filter(p => p.category === selectedCategory);
        }

        // Sort products
        switch (sortOption) {
            case "Terbaru":
                // Keep original order (newest first from API)
                break;
            case "Populer":
                // Sort by popularity (we'll use stock as proxy - higher stock = more popular)
                products.sort((a, b) => (b.stock || 0) - (a.stock || 0));
                break;
            case "Terlaris":
                // Sort by sales (inverse of stock - lower stock = sold more)
                products.sort((a, b) => (a.stock || 999) - (b.stock || 999));
                break;
            case "Harga Terendah":
                products.sort((a, b) => a.price - b.price);
                break;
            case "Harga Tertinggi":
                products.sort((a, b) => b.price - a.price);
                break;
        }

        return products;
    }, [umkm?.menu, selectedCategory, sortOption]);


    useEffect(() => {
        fetchUMKMDetail();
    }, [id]);

    const fetchUMKMDetail = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/umkm/${id}`);
            const data = await response.json();

            if (data.success && data.data) {
                const umkmData = data.data;
                // Transform API data to FoodStand format
                const transformedUMKM: ExtendedFoodStand = {
                    id: String(umkmData.id),
                    name: umkmData.nama_toko || umkmData.nama_usaha || "UMKM",
                    description: umkmData.deskripsi || "",
                    image: umkmData.foto_toko
                        ? `${BASE_URL}/${umkmData.foto_toko}`
                        : umkmData.gambar
                            ? `${BASE_URL}/${umkmData.gambar}`
                            : "",
                    category: umkmData.kategori || "Lainnya",
                    owner: umkmData.pemilik?.nama || umkmData.nama_pemilik || "",
                    whatsapp: umkmData.whatsapp || umkmData.pemilik?.no_telepon || "",
                    instagram: umkmData.instagram || "",
                    about: umkmData.tentang || umkmData.deskripsi || "",
                    location: umkmData.alamat || "",
                    menyediakanJasaKirim: umkmData.menyediakan_jasa_kirim || false,
                    namaBank: umkmData.nama_bank,
                    noRekening: umkmData.no_rekening,
                    atasNama: umkmData.atas_nama,
                    products: [],
                    menu: (umkmData.products || umkmData.produks || []).map((p: any) => ({
                        id: String(p.id),
                        name: p.nama_produk || p.nama,
                        price: parseFloat(p.harga) || 0,
                        image: p.gambar && p.gambar.trim()
                            ? (p.gambar.startsWith('http') || p.gambar.startsWith('data:')
                                ? p.gambar
                                : (p.gambar.includes('/')
                                    ? `${BASE_URL}/${p.gambar}`
                                    : "https://images.unsplash.com/photo-1557821552-17105176677c?w=400"))
                            : "https://images.unsplash.com/photo-1557821552-17105176677c?w=400",
                        description: p.deskripsi || "",
                        category: p.kategori || "",
                        available: p.status === "active" && (p.stok === null || p.stok > 0),
                        stock: p.stok,
                    })),
                };
                setUmkm(transformedUMKM);
            } else {
                setError("UMKM tidak ditemukan");
            }
        } catch (err) {
            console.error("Error fetching UMKM:", err);
            setError("Gagal memuat data UMKM");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!umkm) return;
        addToCart(product, umkm.name, umkm.id, umkm.whatsapp, {
            namaBank: umkm.namaBank,
            noRekening: umkm.noRekening,
            atasNama: umkm.atasNama,
        }, umkm.menyediakanJasaKirim);
    };

    const handleBuyNow = (product: Product, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) {
            toast.info("Silakan login untuk membeli");
            window.dispatchEvent(new CustomEvent("open-login-modal"));
            return;
        }
        setBuyNowProduct(product);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader className="size-12 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Memuat data toko...</p>
                </div>
            </div>
        );
    }

    if (error || !umkm) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Store className="size-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        {error || "Toko tidak ditemukan"}
                    </h2>
                    <button
                        onClick={() => navigate("/umkm")}
                        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                        Kembali ke Daftar UMKM
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-16 pt-20 bg-gray-50 dark:bg-gray-900">
            {/* Tokopedia-Style Store Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-6xl mx-auto px-4 md:px-8 pt-4 pb-6">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors mb-4"
                    >
                        <ArrowLeft className="size-5" />
                        <span className="text-sm font-medium">Kembali</span>
                    </button>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Store Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-3 border-orange-200 dark:border-orange-800 shadow-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30">
                                {umkm.image ? (
                                    <img
                                        src={umkm.image}
                                        alt={umkm.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                            e.currentTarget.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center"><span class="text-3xl font-bold text-orange-500">${umkm.name.charAt(0).toUpperCase()}</span></div>`;
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-3xl font-bold text-orange-500">{umkm.name.charAt(0).toUpperCase()}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Store Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                {/* Left: Name & Details */}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                                        {umkm.name}
                                    </h1>
                                    {umkm.location && (
                                        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                                            <MapPin className="size-3.5 flex-shrink-0" />
                                            <span className="truncate">{umkm.location}</span>
                                        </div>
                                    )}
                                    <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className="inline-flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-3 py-1 rounded-full text-xs font-semibold border border-orange-200 dark:border-orange-800">
                                            <Store className="size-3" />
                                            {umkm.category}
                                        </span>
                                        {umkm.owner && (
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                oleh <span className="font-medium text-gray-700 dark:text-gray-300">{umkm.owner}</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                        {umkm.description}
                                    </p>
                                </div>

                                {/* Right: Action Buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {umkm.whatsapp && (
                                        <a
                                            href={`https://wa.me/${umkm.whatsapp.replace(/\D/g, "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                                        >
                                            <MessageCircle className="size-4" />
                                            Chat Penjual
                                        </a>
                                    )}
                                    {umkm.instagram && (
                                        <a
                                            href={`https://instagram.com/${umkm.instagram.replace("@", "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                                        >
                                            <Instagram className="size-4" />
                                            <span className="hidden sm:inline">{umkm.instagram}</span>
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Stats Row */}
                            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                    <Package className="size-4 text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white">{umkm.menu?.length || 0}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Produk</span>
                                </div>
                                {umkm.whatsapp && (
                                    <a
                                        href={`https://wa.me/${umkm.whatsapp.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 group"
                                    >
                                        <svg viewBox="0 0 24 24" className="size-4 text-green-500" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">{umkm.whatsapp}</span>
                                    </a>
                                )}
                                {umkm.instagram && (
                                    <a
                                        href={`https://instagram.com/${umkm.instagram.replace("@", "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 group"
                                    >
                                        <Instagram className="size-4 text-pink-500" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                            {umkm.instagram.startsWith("@") ? umkm.instagram : `@${umkm.instagram}`}
                                        </span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                    <div className="flex gap-6 border-t border-gray-100 dark:border-gray-700">
                        <button className="relative py-3 text-sm font-semibold text-orange-500 dark:text-orange-400">
                            Produk
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 dark:bg-orange-400 rounded-full" />
                        </button>
                        {umkm.about && umkm.about !== umkm.description && (
                            <button
                                onClick={() => {
                                    const aboutEl = document.getElementById('tentang-kami');
                                    aboutEl?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                            >
                                Tentang
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6">

                {/* Products Section with Sidebar Layout */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                        {/* Sidebar - Categories */}
                        <div className="lg:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4 lg:p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <List className="size-5 text-gray-600 dark:text-gray-400" />
                                <h3 className="font-bold text-gray-800 dark:text-white">Kategori</h3>
                            </div>
                            <ul className="space-y-1">
                                {categories.map((category) => (
                                    <li key={category}>
                                        <button
                                            onClick={() => setSelectedCategory(category)}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${selectedCategory === category
                                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Main Content - Products */}
                        <div className="flex-1 p-4 lg:p-6">
                            {/* Sort Options Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Urutkan</span>
                                    <div className="flex flex-wrap gap-2">
                                        {['Populer', 'Terbaru', 'Terlaris'].map((option) => (
                                            <button
                                                key={option}
                                                onClick={() => setSortOption(option)}
                                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${sortOption === option
                                                    ? 'bg-orange-500 text-white'
                                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                {option}
                                            </button>
                                        ))}
                                        {/* Harga Dropdown */}
                                        <select
                                            value={sortOption.includes('Harga') ? sortOption : ''}
                                            onChange={(e) => e.target.value && setSortOption(e.target.value)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${sortOption.includes('Harga')
                                                ? 'bg-orange-500 text-white'
                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                }`}
                                        >
                                            <option value="">Harga</option>
                                            <option value="Harga Terendah">Terendah</option>
                                            <option value="Harga Tertinggi">Tertinggi</option>
                                        </select>
                                    </div>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {filteredProducts.length} Produk
                                </span>
                            </div>

                            {/* Products Grid */}
                            {filteredProducts.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {(showAllProducts ? filteredProducts : filteredProducts.slice(0, 12)).map((product) => (
                                        <div
                                            key={product.id}
                                            onClick={() => navigate(`/product/${product.id}`)}
                                            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group border border-transparent hover:border-orange-200 dark:hover:border-orange-800"
                                        >
                                            <div className="relative aspect-square bg-gray-200 dark:bg-gray-600">
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${!product.available ? "opacity-50 grayscale" : ""
                                                        }`}
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            "https://images.unsplash.com/photo-1557821552-17105176677c?w=400";
                                                    }}
                                                />
                                                {!product.available && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                                                            Stok Habis
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2 text-sm">
                                                    {product.name}
                                                </h3>
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                                                        Rp {product.price.toLocaleString("id-ID")}
                                                    </span>
                                                    {product.stock !== undefined && product.stock > 0 && (
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            Stok: {product.stock}
                                                        </span>
                                                    )}
                                                </div>
                                                {product.available && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => handleAddToCart(product, e)}
                                                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors text-xs font-medium"
                                                        >
                                                            <ShoppingCart className="size-3" />
                                                            Keranjang
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleBuyNow(product, e)}
                                                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs font-medium"
                                                        >
                                                            <MessageCircle className="size-3" />
                                                            Beli
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <Package className="size-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                                        {selectedCategory !== "Semua Produk" ? "Tidak ada produk di kategori ini" : "Belum ada produk"}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                        {selectedCategory !== "Semua Produk"
                                            ? "Coba pilih kategori lain"
                                            : "Toko ini belum menambahkan produk"}
                                    </p>
                                </div>
                            )}

                            {/* Show More Button */}
                            {filteredProducts.length > 12 && (
                                <div className="text-center mt-8">
                                    <button
                                        onClick={() => setShowAllProducts(!showAllProducts)}
                                        className="inline-flex items-center gap-2 px-8 py-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors font-medium"
                                    >
                                        {showAllProducts ? (
                                            <>
                                                <ChevronUp className="size-5" />
                                                Tampilkan Lebih Sedikit
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="size-5" />
                                                Lihat Semua ({filteredProducts.length - 12} produk lainnya)
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* About Section */}
                {umkm.about && umkm.about !== umkm.description && (
                    <div id="tentang-kami" className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 mt-6">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
                            Tentang Kami
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                            {umkm.about}
                        </p>
                    </div>
                )}
            </div>

            {/* WhatsApp Checkout Modal for Buy Now */}
            {buyNowProduct && umkm && (
                <WhatsAppCheckoutModal
                    isOpen={!!buyNowProduct}
                    onClose={() => setBuyNowProduct(null)}
                    umkmName={umkm.name}
                    umkmWhatsapp={umkm.whatsapp || ""}
                    umkmLocation="Pasar UMKM Digital"
                    buyerName={user?.nama_lengkap || user?.name || ""}
                    buyerPhone={user?.no_telepon || ""}
                    businessId={umkm.id}
                    menyediakanJasaKirim={umkm.menyediakanJasaKirim}
                    namaBank={umkm.namaBank}
                    noRekening={umkm.noRekening}
                    atasNama={umkm.atasNama}
                    items={[
                        {
                            id: buyNowProduct.id,
                            name: buyNowProduct.name,
                            price: buyNowProduct.price,
                            quantity: 1,
                            image: buyNowProduct.image || "",
                            businessName: umkm.name,
                            businessId: umkm.id,
                            description: buyNowProduct.description || "",
                            category: buyNowProduct.category || "product",
                        },
                    ]}
                    total={buyNowProduct.price}
                    onCheckoutComplete={() => {
                        setBuyNowProduct(null);
                    }}
                />
            )}
        </div>
    );
}
