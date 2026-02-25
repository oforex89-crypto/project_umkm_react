import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Store, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL, BASE_HOST } from "../config/api";

interface UMKM {
    id: string;
    name: string;
    owner: string;
    description: string;
    image: string;
    category: string;
    rating?: number;
    address?: string;
    phone?: string;
    productCount?: number;
    products?: any[];
    menyediakanJasaKirim?: boolean;
}

export function UmkmListPage() {
    const navigate = useNavigate();
    const [umkmList, setUmkmList] = useState<UMKM[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Dynamic categories based on available UMKM
    const categories = [
        "All",
        ...Array.from(new Set(umkmList.map((u) => u.category || "Lainnya"))),
    ].filter(Boolean);

    useEffect(() => {
        fetchUMKMs();
    }, []);

    const fetchUMKMs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/umkm`);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                setUmkmList(data.data.map((u: any) => {
                    // Better category extraction - handle multiple possible sources
                    const extractedCategory =
                        u.kategori ||  // direct kategori field
                        u.category?.nama_kategori ||  // nested category object
                        u.category_name ||  // direct category_name field
                        (typeof u.category === 'string' ? u.category : null) ||  // category as string
                        "Lainnya";

                    return {
                        id: u.id || u.kodeumkm,
                        name: u.nama_toko || u.name || u.namaumkm || "",
                        owner: u.nama_pemilik || u.owner || u.pemilik || "",
                        description: u.deskripsi || u.description || "",
                        image: u.foto_toko || u.image || u.gambar || "",
                        category: extractedCategory,
                        rating: u.rating,
                        address: u.alamat || u.address || "",
                        phone: u.whatsapp || u.telepon || u.phone || "",
                        productCount: u.products?.length || 0,
                        products: u.products || [],
                        menyediakanJasaKirim: u.menyediakan_jasa_kirim === 1 || u.menyediakan_jasa_kirim === true,
                    };
                }));
            }
        } catch (error) {
            console.error("Error fetching UMKMs:", error);
            toast.error("Gagal memuat data UMKM");
        } finally {
            setIsLoading(false);
        }
    };

    // Filter UMKMs based on search and category
    const filteredUmkms = umkmList.filter((umkm) => {
        const name = umkm.name || "";
        const owner = umkm.owner || "";
        const description = umkm.description || "";
        const category = umkm.category || "Lainnya";

        const matchesSearch =
            name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
            description.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory =
            selectedCategory === "All" || category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const getImageUrl = (imagePath: string) => {
        if (!imagePath) return "";
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            return imagePath;
        }
        return `${BASE_HOST}/${imagePath}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 pt-20">
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                        Daftar UMKM
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300">
                        Temukan dan dukung UMKM lokal favorit Anda
                    </p>
                </div>

                {/* Search and Filter */}
                <div className="mb-8 space-y-4">
                    {/* Search Bar */}
                    <div className="relative max-w-2xl">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Cari UMKM atau pemilik..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-full border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition-colors"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-6 py-2 rounded-full font-medium transition-all ${selectedCategory === category
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg"
                                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4 text-gray-600 dark:text-gray-400">
                    Menampilkan {filteredUmkms.length} UMKM
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="text-center py-16">
                        <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Memuat UMKM...</p>
                    </div>
                ) : filteredUmkms.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16">
                        <div className="text-gray-400 dark:text-gray-500 mb-4">
                            <Store className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-xl font-semibold">Tidak ada UMKM ditemukan</p>
                            <p className="mt-2">
                                Coba ubah kata kunci pencarian atau filter kategori
                            </p>
                        </div>
                    </div>
                ) : (
                    /* UMKM Grid */
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredUmkms.map((umkm) => (
                            <div
                                key={umkm.id}
                                onClick={() => navigate(`/umkm/${umkm.id}`)}
                                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700 hover:scale-105"
                            >
                                {/* Image */}
                                <div className="relative aspect-square bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                    <img
                                        src={getImageUrl(umkm.image)}
                                        alt={umkm.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={(e) => {
                                            e.currentTarget.src = "https://images.unsplash.com/photo-1557821552-17105176677c?w=400";
                                        }}
                                    />
                                    {/* Product Count Badge */}
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium">
                                        {umkm.productCount || 0} produk
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-3">
                                    <h3 className="font-semibold text-sm text-gray-800 dark:text-white mb-1 line-clamp-2 min-h-[2.5rem]">
                                        {umkm.name}
                                    </h3>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
                                        {umkm.description || "UMKM Lokal"}
                                    </p>

                                    <div className="flex items-center justify-between mt-2">
                                        <div>
                                            <p className="text-orange-600 dark:text-orange-400 font-bold text-xs">
                                                {umkm.owner}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                {umkm.category}
                                            </p>
                                        </div>
                                    </div>

                                    {/* View Store Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/umkm/${umkm.id}`);
                                        }}
                                        className="w-full mt-3 py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-orange-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                                    >
                                        <Store className="w-3 h-3" />
                                        Lihat Toko
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
