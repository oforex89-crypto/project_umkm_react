import { useState, useEffect } from "react";
import { Gift, ShoppingCart, Search, Store } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, BASE_HOST } from "../config/api";

interface PackageItem {
    id?: number;
    nama?: string;
    harga?: number;
    gambar?: string;
    qty?: number;
}

interface GiftPackage {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    items: (string | PackageItem)[];
    createdAt: string;
    stok?: number;
    tanggal_mulai?: string | null;
    tanggal_akhir?: string | null;
    umkm?: {
        id: number;
        nama_toko: string;
        nama_pemilik: string;
    } | null;
}

function getItemName(item: string | PackageItem): string {
    if (typeof item === "string") return item;
    return item.nama || "Item";
}

function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

function isExpiringSoon(tanggal_akhir: string | null | undefined): boolean {
    if (!tanggal_akhir) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = new Date(tanggal_akhir);
    endDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diffDays <= 3 && diffDays >= 0;
}

export function PaketPage() {
    const [packages, setPackages] = useState<GiftPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedPackage, setSelectedPackage] = useState<GiftPackage | null>(null);
    const { addToCart } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        loadPackages();
    }, []);

    const loadPackages = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/gift-packages`);
            const data = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setPackages(data.data);
            } else {
                setPackages([]);
            }
        } catch (error) {
            console.error("Error loading gift packages:", error);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = (pkg: GiftPackage) => {
        let imageUrl = pkg.image;
        if (pkg.image && !(pkg.image.startsWith("http://") || pkg.image.startsWith("https://"))) {
            imageUrl = `${BASE_HOST}/${pkg.image}`;
        }
        addToCart(
            {
                id: pkg.id,
                name: pkg.name,
                price: pkg.price,
                image: imageUrl,
                standName: pkg.umkm ? pkg.umkm.nama_toko : "🎁 Paket Spesial",
                standId: pkg.umkm ? `umkm_${pkg.umkm.id}` : "special_packages",
                available: true,
            },
            pkg.umkm ? pkg.umkm.nama_toko : "🎁 Paket Spesial",
            pkg.umkm ? `umkm_${pkg.umkm.id}` : "special_packages"
        );
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const filteredPackages = packages.filter(
        (pkg) =>
            searchQuery === "" ||
            pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pkg.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pkg.umkm?.nama_toko?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <div className="min-h-screen pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                            Paket Spesial
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Temukan paket hadiah istimewa dari berbagai UMKM lokal
                        </p>
                    </div>

                    {/* Search */}
                    <div className="mb-8 space-y-4">
                        <div className="relative max-w-2xl">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari paket atau toko..."
                                className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition-colors"
                            />
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="mb-4 text-gray-600 dark:text-gray-400">
                        Menampilkan {filteredPackages.length} Paket
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg animate-pulse">
                                    <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                                    <div className="p-5 space-y-3">
                                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredPackages.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                            <Gift className="size-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                {searchQuery ? "Tidak ada paket ditemukan" : "Belum ada paket tersedia"}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {searchQuery ? `Tidak ada paket yang cocok dengan "${searchQuery}"` : "Paket spesial akan segera hadir!"}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredPackages.map((pkg) => (
                                <div
                                    key={pkg.id}
                                    className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                                    onClick={() => setSelectedPackage(pkg)}
                                >
                                    {/* Image */}
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={
                                                pkg.image && (pkg.image.startsWith("http://") || pkg.image.startsWith("https://"))
                                                    ? pkg.image
                                                    : pkg.image ? `${BASE_HOST}/${pkg.image}` : "/api/placeholder/400/300"
                                            }
                                            alt={pkg.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        />
                                        <div className="absolute top-3 right-3">
                                            <span className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-full shadow-lg flex items-center gap-1">
                                                <Gift className="size-3" />
                                                Paket
                                            </span>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 line-clamp-1">{pkg.name}</h3>

                                        <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1">
                                            {pkg.umkm ? (
                                                <><span>🏪</span><span className="truncate">{pkg.umkm.nama_toko}</span></>
                                            ) : (
                                                <><span>🏛️</span><span>Paket Resmi Gereja</span></>
                                            )}
                                        </p>

                                        {(pkg.tanggal_mulai || pkg.tanggal_akhir) && (
                                            <div className={`text-xs mb-2 flex items-center gap-1 ${isExpiringSoon(pkg.tanggal_akhir) ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                                                <span>📅</span>
                                                <span>
                                                    {pkg.tanggal_mulai && pkg.tanggal_akhir
                                                        ? `${formatDate(pkg.tanggal_mulai)} - ${formatDate(pkg.tanggal_akhir)}`
                                                        : pkg.tanggal_akhir
                                                            ? `s/d ${formatDate(pkg.tanggal_akhir)}`
                                                            : `Mulai ${formatDate(pkg.tanggal_mulai)}`}
                                                </span>
                                                {isExpiringSoon(pkg.tanggal_akhir) && (
                                                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded text-[10px] uppercase font-bold">
                                                        Segera Berakhir!
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 min-h-[40px]">{pkg.description}</p>

                                        {/* Items Preview */}
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-2">Berisi {pkg.items?.length || 0} item:</p>
                                            <div className="space-y-1">
                                                {pkg.items && pkg.items.length > 0 ? (
                                                    <>
                                                        {pkg.items.slice(0, 2).map((item, idx) => (
                                                            <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-2">
                                                                <span className="text-indigo-600 dark:text-indigo-400 mt-0.5">✓</span>
                                                                <span className="line-clamp-1">{getItemName(item)}</span>
                                                            </p>
                                                        ))}
                                                        {pkg.items.length > 2 && (
                                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">+{pkg.items.length - 2} item lainnya</p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p className="text-xs text-gray-500 italic">{pkg.description}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(pkg.price)}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleAddToCart(pkg); }}
                                                className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center gap-2 text-sm"
                                            >
                                                <ShoppingCart className="size-4" />
                                                <span className="hidden sm:inline">Tambah</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Package Detail Modal */}
            {selectedPackage && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedPackage(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="relative h-64 md:h-80">
                            <img
                                src={
                                    selectedPackage.image && (selectedPackage.image.startsWith("http://") || selectedPackage.image.startsWith("https://"))
                                        ? selectedPackage.image
                                        : selectedPackage.image ? `${BASE_HOST}/${selectedPackage.image}` : "/api/placeholder/400/300"
                                }
                                alt={selectedPackage.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 right-4">
                                <span className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-full shadow-lg flex items-center gap-2">
                                    <Gift className="size-4" />
                                    Paket
                                </span>
                            </div>
                            <button onClick={() => setSelectedPackage(null)} className="absolute top-4 left-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors">✕</button>
                        </div>

                        <div className="p-6 md:p-8">
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{selectedPackage.name}</h2>
                                <p className="text-sm text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-2">
                                    {selectedPackage.umkm ? (
                                        <>
                                            <Store className="size-4" />
                                            <span>{selectedPackage.umkm.nama_toko}</span>
                                            <span className="text-gray-400">•</span>
                                            <span className="text-gray-500 dark:text-gray-400">{selectedPackage.umkm.nama_pemilik}</span>
                                        </>
                                    ) : (
                                        <><span>🏛️</span><span>Paket Resmi Gereja</span></>
                                    )}
                                </p>

                                {(selectedPackage.tanggal_mulai || selectedPackage.tanggal_akhir) && (
                                    <div className={`text-sm mb-3 flex items-center gap-2 ${isExpiringSoon(selectedPackage.tanggal_akhir) ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-500 dark:text-gray-400"}`}>
                                        <span>📅</span>
                                        <span>
                                            {selectedPackage.tanggal_mulai && selectedPackage.tanggal_akhir
                                                ? `${formatDate(selectedPackage.tanggal_mulai)} - ${formatDate(selectedPackage.tanggal_akhir)}`
                                                : selectedPackage.tanggal_akhir
                                                    ? `Berlaku s/d ${formatDate(selectedPackage.tanggal_akhir)}`
                                                    : `Mulai ${formatDate(selectedPackage.tanggal_mulai)}`}
                                        </span>
                                    </div>
                                )}

                                <p className="text-gray-600 dark:text-gray-400">{selectedPackage.description}</p>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                    <Gift className="size-5 text-indigo-600 dark:text-indigo-400" />
                                    Isi Paket ({selectedPackage.items?.length || 0} item)
                                </h3>
                                <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-4 space-y-3">
                                    {selectedPackage.items && selectedPackage.items.length > 0 ? (
                                        selectedPackage.items.map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs">{idx + 1}</div>
                                                <p className="text-gray-700 dark:text-gray-300 flex-1">{getItemName(item)}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-600 dark:text-gray-400 text-center py-4">{selectedPackage.description}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Harga Paket</p>
                                    <p className="text-2xl font-semibold text-indigo-600 dark:text-indigo-400">{formatCurrency(selectedPackage.price)}</p>
                                </div>
                                <button
                                    onClick={() => { handleAddToCart(selectedPackage); setSelectedPackage(null); }}
                                    className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors flex items-center gap-2 shadow-lg hover:shadow-xl"
                                >
                                    <ShoppingCart className="size-5" />
                                    Tambah ke Keranjang
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
