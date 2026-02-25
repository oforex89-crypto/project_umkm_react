import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ShoppingCart, MessageCircle, Loader, Package, Store, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "../types";
import { WhatsAppCheckoutModal } from "../components/WhatsAppCheckoutModal";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { API_BASE_URL, BASE_HOST } from "../config/api";
import ImageCarousel from "../components/ImageCarousel";

import { VariantType } from "../types";

// Base URL without /api suffix for image URLs
const BASE_URL = BASE_HOST;

interface ProductWithUMKM extends Product {
    umkm?: {
        id: string;
        nama_toko: string;
        whatsapp: string;
        menyediakan_jasa_kirim: boolean;
        nama_bank?: string;
        no_rekening?: string;
        atas_nama?: string;
    };
    variant_types?: VariantType[];
}

export function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();

    const [product, setProduct] = useState<ProductWithUMKM | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [showCheckout, setShowCheckout] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
    const [randomOtherProducts, setRandomOtherProducts] = useState<Product[]>([]);
    // Variant selection state
    const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
    const relatedScrollRef = useRef<HTMLDivElement>(null);
    const similarScrollRef = useRef<HTMLDivElement>(null);
    const randomOthersScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.scrollTo(0, 0); // Scroll to top when product changes
        fetchProduct();
        fetchRelatedProducts();
        fetchSimilarProducts();
        fetchRandomOtherProducts();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`${API_BASE_URL}/products/${id}`);
            const data = await response.json();

            if (data.success && data.data) {
                const p = data.data;
                const transformedProduct: ProductWithUMKM = {
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
                    umkm: p.umkm ? {
                        id: String(p.umkm.id),
                        nama_toko: p.umkm.nama_toko || p.umkm.nama_usaha,
                        whatsapp: p.umkm.whatsapp || "",
                        menyediakan_jasa_kirim: p.umkm.menyediakan_jasa_kirim || false,
                        nama_bank: p.umkm.nama_bank,
                        no_rekening: p.umkm.no_rekening,
                        atas_nama: p.umkm.atas_nama,
                    } : undefined,
                    all_images: Array.isArray(p.all_images) ? p.all_images : undefined,
                    variant_types: Array.isArray(p.variant_types) ? p.variant_types.map((vt: any) => ({
                        id: vt.id,
                        name: vt.name,
                        display_order: vt.display_order,
                        options: (vt.options || []).map((opt: any) => ({
                            id: opt.id,
                            value: opt.value,
                            price_adjustment: opt.price_adjustment,
                            stock: opt.stock,
                            image: opt.image,
                            display_order: opt.display_order,
                        })),
                    })) : undefined,
                };
                setProduct(transformedProduct);
            } else {
                setError("Produk tidak ditemukan");
            }
        } catch (err) {
            console.error("Error fetching product:", err);
            setError("Gagal memuat data produk");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRelatedProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}/related`);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                const transformed = data.data.map((p: any) => ({
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
                }));
                setRelatedProducts(transformed);
            }
        } catch (err) {
            console.error("Error fetching related products:", err);
        }
    };

    const fetchSimilarProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}/similar`);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                const transformed = data.data.map((p: any) => ({
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
                }));
                setSimilarProducts(transformed);
            }
        } catch (err) {
            console.error("Error fetching similar products:", err);
        }
    };

    const fetchRandomOtherProducts = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/products/${id}/random-others`);
            const data = await response.json();

            if (data.success && Array.isArray(data.data)) {
                const transformed = data.data.map((p: any) => ({
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
                }));
                setRandomOtherProducts(transformed);
            }
        } catch (err) {
            console.error("Error fetching random other products:", err);
        }
    };

    const scrollCarousel = (ref: ReturnType<typeof useRef<HTMLDivElement>>, direction: 'left' | 'right') => {
        if (ref.current) {
            const scrollAmount = 400; // Scroll by ~2 cards (200px each)
            const newScrollLeft = direction === 'left'
                ? ref.current.scrollLeft - scrollAmount
                : ref.current.scrollLeft + scrollAmount;

            ref.current.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            });
        }
    };

    // Variant helpers
    const hasVariants = product?.variant_types && product.variant_types.length > 0;
    const allVariantsSelected = hasVariants
        ? product!.variant_types!.every(vt => selectedOptions[vt.name] !== undefined)
        : true;

    const getSelectedVariantPrice = () => {
        if (!hasVariants || !product) return product?.price || 0;
        let adj = 0;
        product.variant_types!.forEach(vt => {
            const selId = selectedOptions[vt.name];
            if (selId !== undefined) {
                const opt = vt.options.find(o => o.id === selId);
                if (opt) adj += Number(opt.price_adjustment) || 0;
            }
        });
        return (product.price || 0) + adj;
    };

    const getSelectedVariantStock = () => {
        if (!hasVariants || !product) return product?.stock;
        // Use the last selected variant's stock if available
        const lastType = product.variant_types![product.variant_types!.length - 1];
        const selId = selectedOptions[lastType.name];
        if (selId !== undefined) {
            const opt = lastType.options.find(o => o.id === selId);
            if (opt && opt.stock != null) return opt.stock;
        }
        return product.stock;
    };

    const getSelectedVariantImage = () => {
        if (!hasVariants || !product) return null;
        const firstType = product.variant_types![0];
        const selId = selectedOptions[firstType.name];
        if (selId !== undefined) {
            const opt = firstType.options.find(o => o.id === selId);
            if (opt?.image) {
                return opt.image.startsWith('http') ? opt.image : `${BASE_URL}/${opt.image}`;
            }
        }
        return null;
    };

    const displayPrice = getSelectedVariantPrice();
    const displayStock = getSelectedVariantStock();
    const variantImage = getSelectedVariantImage();

    const handleAddToCart = () => {
        if (!product || !product.umkm) return;
        if (hasVariants && !allVariantsSelected) {
            toast.error("Pilih semua varian terlebih dahulu");
            return;
        }

        // Build selectedVariants object
        const selectedVariants: Record<string, { optionId: number; value: string; priceAdjustment: number }> = {};
        if (hasVariants) {
            product.variant_types!.forEach(vt => {
                const selId = selectedOptions[vt.name];
                if (selId !== undefined) {
                    const opt = vt.options.find(o => o.id === selId);
                    if (opt) {
                        selectedVariants[vt.name] = {
                            optionId: opt.id,
                            value: opt.value,
                            priceAdjustment: Number(opt.price_adjustment) || 0,
                        };
                    }
                }
            });
        }

        const productWithVariants = {
            ...product,
            selectedVariants: Object.keys(selectedVariants).length > 0 ? selectedVariants : undefined,
        };

        for (let i = 0; i < quantity; i++) {
            addToCart(
                productWithVariants,
                product.umkm.nama_toko,
                product.umkm.id,
                product.umkm.whatsapp,
                {
                    namaBank: product.umkm.nama_bank,
                    noRekening: product.umkm.no_rekening,
                    atasNama: product.umkm.atas_nama,
                },
                product.umkm.menyediakan_jasa_kirim
            );
        }
    };

    const handleBuyNow = () => {
        if (!user) {
            toast.info("Silakan login untuk membeli");
            window.dispatchEvent(new CustomEvent("open-login-modal"));
            return;
        }
        setShowCheckout(true);
    };

    const incrementQuantity = () => {
        if (product?.stock && quantity >= product.stock) {
            toast.error(`Stok tersedia hanya ${product.stock}`);
            return;
        }
        setQuantity((prev) => prev + 1);
    };

    const decrementQuantity = () => {
        if (quantity > 1) setQuantity((prev) => prev - 1);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader className="size-12 text-orange-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Memuat data produk...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Package className="size-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                        {error || "Produk tidak ditemukan"}
                    </h2>
                    <button
                        onClick={() => navigate("/products")}
                        className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
                    >
                        Kembali ke Daftar Produk
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-16">
            {/* Back Button */}
            <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors mb-4 bg-white dark:bg-gray-800 px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md"
                >
                    <ArrowLeft className="size-5" />
                    <span className="font-medium">Kembali</span>
                </button>
            </div>

            {/* Product Content */}
            <div className="max-w-6xl mx-auto px-4 md:px-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Product Image */}
                        <div className="relative aspect-square md:aspect-auto md:h-full bg-gray-100 dark:bg-gray-700">
                            {(() => {
                                // If a variant image is selected, show that
                                const mainImgSrc = variantImage || product.image;
                                const imgList = variantImage
                                    ? [variantImage, ...(product.all_images || [])]
                                    : product.all_images;
                                return imgList && imgList.length > 1 ? (
                                    <div className={`w-full h-full ${!product.available ? "opacity-50 grayscale" : ""}`}>
                                        <ImageCarousel
                                            images={imgList}
                                            aspectRatio="1/1"
                                            showDots={true}
                                            showArrows={true}
                                            autoRotateMs={4000}
                                        />
                                    </div>
                                ) : (
                                    <img
                                        src={mainImgSrc}
                                        alt={product.name}
                                        className={`w-full h-full object-cover ${!product.available ? "opacity-50 grayscale" : ""}`}
                                        onError={(e) => {
                                            e.currentTarget.src =
                                                "https://images.unsplash.com/photo-1557821552-17105176677c?w=800";
                                        }}
                                    />
                                );
                            })()}
                            {!product.available && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-red-500 text-white px-6 py-2 rounded-full text-lg font-semibold shadow-lg">
                                        Stok Habis
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Product Info */}
                        <div className="p-6 md:p-8 flex flex-col">
                            {/* Category */}
                            <span className="inline-block w-fit bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
                                {product.category}
                            </span>

                            {/* Name */}
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                                {product.name}
                            </h1>

                            {/* Price */}
                            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-4">
                                Rp {displayPrice.toLocaleString("id-ID")}
                                {hasVariants && !allVariantsSelected && (
                                    <span className="text-sm font-normal text-gray-400 ml-2">~ harga dasar</span>
                                )}
                            </div>

                            {/* Stock Info */}
                            {displayStock !== undefined && displayStock > 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Stok tersedia: <span className="font-medium">{displayStock}</span>
                                </div>
                            )}

                            {/* ═══════════════════════════ */}
                            {/* VARIANT SELECTION UI */}
                            {/* ═══════════════════════════ */}
                            {hasVariants && (
                                <div className="mb-6 space-y-4">
                                    {product.variant_types!.map(vt => (
                                        <div key={vt.id}>
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                {vt.name}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {vt.options.map(opt => {
                                                    const isSelected = selectedOptions[vt.name] === opt.id;
                                                    const outOfStock = opt.stock !== null && opt.stock !== undefined && opt.stock <= 0;
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            type="button"
                                                            disabled={outOfStock}
                                                            onClick={() => setSelectedOptions(prev => ({
                                                                ...prev,
                                                                [vt.name]: prev[vt.name] === opt.id ? undefined! : opt.id,
                                                            }))}
                                                            className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${outOfStock
                                                                ? 'border-gray-200 dark:border-gray-700 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through'
                                                                : isSelected
                                                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                                    : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-orange-300 dark:hover:border-orange-500'
                                                                }`}
                                                        >
                                                            {opt.value}
                                                            {Number(opt.price_adjustment) > 0 && (
                                                                <span className="text-xs text-gray-400 ml-1">
                                                                    +Rp{Number(opt.price_adjustment).toLocaleString('id-ID')}
                                                                </span>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                    {!allVariantsSelected && (
                                        <p className="text-xs text-orange-500 dark:text-orange-400">
                                            Pilih semua varian sebelum menambahkan ke keranjang
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Description */}
                            {product.description && (
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                                        Deskripsi
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        {product.description}
                                    </p>
                                </div>
                            )}

                            {/* UMKM Info */}
                            {product.umkm && (
                                <div
                                    onClick={() => navigate(`/umkm/${product.umkm?.id}`)}
                                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg">
                                        <Store className="size-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Dijual oleh</div>
                                        <div className="font-semibold text-gray-800 dark:text-white">
                                            {product.umkm.nama_toko}
                                        </div>
                                    </div>
                                    <ArrowLeft className="size-5 text-gray-400 rotate-180" />
                                </div>
                            )}

                            {/* Spacer */}
                            <div className="flex-1" />

                            {/* Quantity & Actions */}
                            {product.available && (
                                <div className="space-y-4 mt-auto">
                                    {/* Quantity Selector */}
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-600 dark:text-gray-400">Jumlah:</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={decrementQuantity}
                                                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                            >
                                                <Minus className="size-4" />
                                            </button>
                                            <span className="w-12 text-center font-semibold text-lg">
                                                {quantity}
                                            </span>
                                            <button
                                                onClick={incrementQuantity}
                                                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                                            >
                                                <Plus className="size-4" />
                                            </button>
                                        </div>
                                        <span className="text-gray-500 dark:text-gray-400 text-sm">
                                            = Rp {(product.price * quantity).toLocaleString("id-ID")}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleAddToCart}
                                            disabled={hasVariants && !allVariantsSelected}
                                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-colors font-semibold ${hasVariants && !allVariantsSelected
                                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
                                                }`}
                                        >
                                            <ShoppingCart className="size-5" />
                                            Tambah ke Keranjang
                                        </button>
                                        <button
                                            onClick={handleBuyNow}
                                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-colors font-semibold"
                                        >
                                            <MessageCircle className="size-5" />
                                            Beli Sekarang
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products from Same Store */}
            {relatedProducts.length > 0 && (
                <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                        {product?.umkm ? `Produk Lain dari ${product.umkm.nama_toko}` : 'Produk Lainnya'}
                    </h2>
                    <div className="relative">
                        {/* Navigation Buttons */}
                        <button
                            onClick={() => scrollCarousel(relatedScrollRef, 'left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
                        </button>
                        <button
                            onClick={() => scrollCarousel(relatedScrollRef, 'right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-800 dark:text-white" />
                        </button>
                        <div ref={relatedScrollRef} className="flex gap-4 overflow-x-auto pb-4 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {relatedProducts.map((relatedProduct) => (
                                <div
                                    key={relatedProduct.id}
                                    onClick={() => navigate(`/product/${relatedProduct.id}`)}
                                    className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700 hover:scale-105"
                                >
                                    <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                        <img
                                            src={relatedProduct.image}
                                            alt={relatedProduct.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://images.unsplash.com/photo-1557821552-17105176677c?w=400";
                                            }}
                                        />
                                        {!relatedProduct.available && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                    Stok Habis
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-semibold text-sm text-gray-800 dark:text-white mb-1 line-clamp-2 min-h-[2.5rem]">
                                            {relatedProduct.name}
                                        </h3>
                                        <p className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                                            Rp {relatedProduct.price.toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Similar Products by Category */}
            {similarProducts.length > 0 && (
                <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                        Produk Serupa
                    </h2>
                    <div className="relative">
                        {/* Navigation Buttons */}
                        <button
                            onClick={() => scrollCarousel(similarScrollRef, 'left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
                        </button>
                        <button
                            onClick={() => scrollCarousel(similarScrollRef, 'right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-800 dark:text-white" />
                        </button>
                        <div ref={similarScrollRef} className="flex gap-4 overflow-x-auto pb-4 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {similarProducts.map((similarProduct) => (
                                <div
                                    key={similarProduct.id}
                                    onClick={() => navigate(`/product/${similarProduct.id}`)}
                                    className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700 hover:scale-105"
                                >
                                    <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                        <img
                                            src={similarProduct.image}
                                            alt={similarProduct.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://images.unsplash.com/photo-1557821552-17105176677c?w=400";
                                            }}
                                        />
                                        {!similarProduct.available && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                    Stok Habis
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-semibold text-sm text-gray-800 dark:text-white mb-1 line-clamp-2 min-h-[2.5rem]">
                                            {similarProduct.name}
                                        </h3>
                                        <p className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                                            Rp {similarProduct.price.toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Random Products from Other Stores */}
            {randomOtherProducts.length > 0 && (
                <div className="max-w-6xl mx-auto px-4 md:px-8 mt-12">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                        Produk dari Toko Lain
                    </h2>
                    <div className="relative">
                        {/* Navigation Buttons */}
                        <button
                            onClick={() => scrollCarousel(randomOthersScrollRef, 'left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Scroll left"
                        >
                            <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
                        </button>
                        <button
                            onClick={() => scrollCarousel(randomOthersScrollRef, 'right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Scroll right"
                        >
                            <ChevronRight className="w-6 h-6 text-gray-800 dark:text-white" />
                        </button>
                        <div ref={randomOthersScrollRef} className="flex gap-4 overflow-x-auto pb-4 scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {randomOtherProducts.map((randomProduct) => (
                                <div
                                    key={randomProduct.id}
                                    onClick={() => navigate(`/product/${randomProduct.id}`)}
                                    className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group border border-gray-200 dark:border-gray-700 hover:scale-105"
                                >
                                    <div className="relative w-full h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                        <img
                                            src={randomProduct.image}
                                            alt={randomProduct.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.src = "https://images.unsplash.com/photo-1557821552-17105176677c?w=400";
                                            }}
                                        />
                                        {!randomProduct.available && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                                                    Stok Habis
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-semibold text-sm text-gray-800 dark:text-white mb-1 line-clamp-2 min-h-[2.5rem]">
                                            {randomProduct.name}
                                        </h3>
                                        <p className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                                            Rp {randomProduct.price.toLocaleString("id-ID")}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Checkout Modal */}
            {showCheckout && product && product.umkm && (
                <WhatsAppCheckoutModal
                    isOpen={showCheckout}
                    onClose={() => setShowCheckout(false)}
                    umkmName={product.umkm.nama_toko}
                    umkmWhatsapp={product.umkm.whatsapp}
                    umkmLocation="Pasar UMKM Digital"
                    buyerName={user?.nama_lengkap || user?.name || ""}
                    buyerPhone={user?.no_telepon || ""}
                    businessId={product.umkm.id}
                    menyediakanJasaKirim={product.umkm.menyediakan_jasa_kirim}
                    namaBank={product.umkm.nama_bank}
                    noRekening={product.umkm.no_rekening}
                    atasNama={product.umkm.atas_nama}
                    items={[
                        {
                            id: product.id,
                            name: product.name,
                            price: product.price,
                            quantity: quantity,
                            image: product.image || "",
                            businessName: product.umkm.nama_toko,
                            businessId: product.umkm.id,
                            description: product.description || "",
                            category: product.category || "product",
                        },
                    ]}
                    total={product.price * quantity}
                    onCheckoutComplete={() => {
                        setShowCheckout(false);
                    }}
                />
            )}
        </div>
    );
}
