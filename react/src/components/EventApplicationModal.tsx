import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { X, Calendar, MapPin, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL, BASE_HOST } from "../config/api";

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  image?: string;
  status: string;
}

interface Business {
  id: string;
  name: string;
  products: Product[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
}

interface EventApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onRegisterStore?: () => void;
}

export function EventApplicationModal({
  isOpen,
  onClose,
  eventId,
  onRegisterStore,
}: EventApplicationModalProps) {
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [myBusinesses, setMyBusinesses] = useState<Business[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [productSearch, setProductSearch] = useState("");

  // Agreement document state - stores both File object and preview
  const [agreementFile, setAgreementFile] = useState<{
    file: File;
    name: string;
    data: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEvent();
      fetchMyBusinesses();
    }
  }, [isOpen, eventId]);

  const fetchEvent = () => {
    // Pakai localStorage saja
    const localEvents = localStorage.getItem("pasar_umkm_events");
    if (localEvents) {
      const events = JSON.parse(localEvents);
      const foundEvent = events.find((e: Event) => e.id === eventId);
      setEvent(foundEvent || null);
    }
  };

  const fetchMyBusinesses = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch from API instead of localStorage
      console.log("[EventApplicationModal] Fetching businesses for user:", user.id);
      const response = await fetch(`${API_BASE_URL}/umkm/my-umkm`, {
        headers: {
          "X-User-ID": String(user.id),
        },
      });
      const data = await response.json();
      console.log("[EventApplicationModal] API response:", data);

      if (data.success && data.data && data.data.length > 0) {
        // Filter only active (approved) stores
        const activeStores = data.data.filter((u: any) => u.status === "active");
        console.log("[EventApplicationModal] Active stores:", activeStores);

        // Map to expected format with products
        const businessesWithProducts = activeStores.map((umkm: any) => ({
          id: String(umkm.id),
          name: umkm.nama_toko,
          products: (umkm.products || []).map((p: any) => ({
            id: String(p.id),
            name: p.nama_produk,
            price: parseFloat(p.harga) || 0,
            image: p.gambar ? (p.gambar.startsWith('data:') || p.gambar.startsWith('http') ? p.gambar : `${BASE_HOST}/${p.gambar}`) : "",
            description: p.deskripsi || "",
          })),
        }));

        setMyBusinesses(businessesWithProducts);

        // Auto-select first business if available
        if (businessesWithProducts.length > 0) {
          setSelectedBusinessId(businessesWithProducts[0].id);
        }
      } else {
        setMyBusinesses([]);
      }
    } catch (error) {
      console.error("Error fetching businesses:", error);
      toast.error("Gagal memuat data toko");
      setMyBusinesses([]);
    }

    setIsLoading(false);
  };

  const handleProductToggle = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBusinessId) {
      toast.error("Pilih toko yang akan didaftarkan");
      return;
    }

    // At least one product must be selected
    if (selectedProducts.size === 0) {
      toast.error("Pilih minimal 1 produk");
      return;
    }

    if (!user) {
      toast.error("Anda harus login terlebih dahulu");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedBusiness = myBusinesses.find(
        (b) => b.id === selectedBusinessId
      );

      // Get regular product IDs as array
      const productIds = Array.from(selectedProducts);

      // Create FormData for file upload support
      const formData = new FormData();
      formData.append('event_id', eventId);
      formData.append('umkm_id', selectedBusiness?.id || '');
      formData.append('user_id', String(user.id));
      formData.append('products', JSON.stringify(productIds));
      if (notes) formData.append('notes', notes);

      if (agreementFile?.file) {
        formData.append('agreement_file', agreementFile.file);
      }

      // Call API to register vendor
      const response = await fetch(`${API_BASE_URL}/events/register-vendor`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          "Aplikasi berhasil dikirim! Admin akan meninjau pendaftaran Anda."
        );
        onClose();
      } else {
        toast.error(data.message || "Gagal mengirim aplikasi");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      toast.error("Gagal mengirim aplikasi. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }

    // Reset form
    setSelectedBusinessId("");
    setSelectedProducts(new Set());
    setNotes("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

  const selectedBusiness = myBusinesses.find(
    (b) => b.id === selectedBusinessId
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2>Daftar Berjualan di Event</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="size-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Memuat data...</p>
          </div>
        ) : myBusinesses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Anda belum memiliki toko yang terdaftar. Silakan ajukan toko
              terlebih dahulu untuk bisa mendaftar di event.
            </p>
            <div className="flex gap-3 justify-center">
              {onRegisterStore && (
                <button
                  onClick={() => {
                    onClose();
                    onRegisterStore();
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                  Daftar Toko UMKM
                </button>
              )}
              <button
                onClick={onClose}
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Event Info */}
            {event && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4 mb-6">
                <h3 className="mb-2 dark:text-white">{event.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  {event.description}
                </p>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <Calendar className="size-4" />
                    {formatDate(event.date)}
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                    <MapPin className="size-4" />
                    {event.location}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Store Info (auto-selected) */}
              {selectedBusiness && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-800 rounded-lg flex items-center justify-center">
                      <span className="text-xl">🏪</span>
                    </div>
                    <div>
                      <h4 className="font-medium dark:text-white">{selectedBusiness.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{selectedBusiness.products.length} produk tersedia</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Search & Selection */}
              {selectedBusiness && (
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    Pilih Produk yang Akan Dijual ({selectedProducts.size} dipilih)
                  </label>

                  {/* Search Bar */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Cari produk..."
                      className="w-full px-4 py-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {productSearch && (
                      <button
                        type="button"
                        onClick={() => setProductSearch("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {selectedBusiness.products.length === 0 ? (
                    <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 text-sm text-yellow-800 dark:text-yellow-200">
                      Toko ini belum memiliki produk. Tambahkan produk terlebih
                      dahulu melalui Dashboard UMKM.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
                      {selectedBusiness.products
                        .filter((product) =>
                          product.name.toLowerCase().includes(productSearch.toLowerCase())
                        )
                        .map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleProductToggle(product.id)}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${selectedProducts.has(product.id)
                              ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30"
                              : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500"
                              }`}
                          >
                            <div className="flex gap-3">
                              {product.image && (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-20 h-20 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <div className="flex items-start justify-between mb-1">
                                  <h4 className="text-sm font-medium dark:text-white">
                                    {product.name}
                                  </h4>
                                  {selectedProducts.has(product.id) && (
                                    <CheckCircle className="size-5 text-indigo-600 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-sm text-indigo-600 font-medium">
                                  {formatCurrency(product.price)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                                  {product.description}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}


              {/* Agreement Document Section */}
              <div className="space-y-3 border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-sm font-medium dark:text-gray-200 flex items-center gap-2">
                  📋 Surat Perjanjian Kerjasama
                </h4>

                {/* Download Template */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                        Download Template Perjanjian
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                        Buka, isi, cetak/simpan PDF, tanda tangan, lalu upload
                      </p>
                    </div>
                    <a
                      href="/templates/perjanjian-kerjasama-event.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Buka Template
                    </a>
                  </div>
                </div>

                {/* Upload Signed Agreement */}
                <div>
                  <label className="block text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Upload Surat Perjanjian yang Sudah Ditandatangani
                  </label>
                  {agreementFile ? (
                    <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200 truncate">
                          {agreementFile.name}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          File berhasil diupload
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAgreementFile(null)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <svg className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Klik untuk upload file (PDF/JPG/PNG)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error("Ukuran file maksimal 5MB");
                              return;
                            }
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAgreementFile({
                                file: file, // Store the actual File object
                                name: file.name,
                                data: reader.result as string,
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Catatan Tambahan (opsional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  rows={4}
                  placeholder="Tuliskan informasi tambahan yang perlu admin ketahui..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || selectedProducts.size === 0}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Aplikasi"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-gray-200"
                >
                  Batal
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
