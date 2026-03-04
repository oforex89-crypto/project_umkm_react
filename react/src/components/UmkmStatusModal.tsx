import { X, Clock, CheckCircle, XCircle, Store, Package, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, BASE_HOST } from "../config/api";

interface UmkmStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  nama_produk: string;
  harga: number;
  status: string;
  approval_status?: string;
  gambar?: string;
  deskripsi?: string;
  kategori?: string;
  stok?: number;
  rejection_comment?: string;
}

interface SubmissionStatus {
  id: string;
  nama_toko: string;
  nama_pemilik: string;
  alamat_toko: string;
  whatsapp: string;
  status: "pending" | "approved" | "rejected";
  kategori_id: string;
  category?: {
    nama_kategori: string;
  };
  rejection_reason?: string;
  products?: Product[];
  // Paroki info
  paroki?: string;
  umat?: string;
  // Bank info
  nama_bank?: string;
  no_rekening?: string;
  atas_nama?: string;
  // Additional info
  about?: string;
  jasa_kirim?: boolean;
}

export function UmkmStatusModal({ isOpen, onClose }: UmkmStatusModalProps) {
  const { user, refreshUser } = useAuth();
  const [submission, setSubmission] = useState<SubmissionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Edit product state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    nama_produk: '',
    deskripsi: '',
    harga: 0,
    kategori: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit store state
  const [isEditingStore, setIsEditingStore] = useState(false);
  const [storeEditForm, setStoreEditForm] = useState({
    nama_toko: '',
    nama_pemilik: '',
    alamat_toko: '',
    whatsapp: '',
    // Paroki info
    paroki: '',
    umat: '',
    // Bank info
    nama_bank: '',
    no_rekening: '',
    atas_nama: '',
    // Additional info
    about: '',
    jasa_kirim: false,
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchSubmissionStatus();
    }
  }, [isOpen, user]);

  const fetchSubmissionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get from role-requests first
      const roleResponse = await fetch(
        `${API_BASE_URL}/role-requests/user/${user?.id}`
      );
      const roleData = await roleResponse.json();

      if (roleResponse.ok && roleData.success) {
        console.log("Role data received:", roleData.data);
        const d = roleData.data;
        let submissionData: SubmissionStatus = {
          // Handle both modern (nama_toko) and legacy (namatoko) field names
          id: d.id || d.kodepengguna || "Unknown",
          nama_toko: d.nama_toko || d.namatoko || "",
          nama_pemilik: d.nama_pemilik || d.namapemilik || "",
          alamat_toko: d.alamat_toko || d.alamat || d.alamattoko || "",
          whatsapp: d.whatsapp || d.telepon || "",
          status: d.status || d.statuspengajuan || "pending",
          kategori_id: d.kategori_id || d.kodekategori || "",
          category: {
            nama_kategori: d.kategori || d.category?.nama_kategori || "Tidak diketahui",
          },
          products: d.products || [],
          // Paroki info
          paroki: d.paroki || "",
          umat: d.umat || "",
          // Bank info
          nama_bank: d.nama_bank || "",
          no_rekening: d.no_rekening || "",
          atas_nama: d.atas_nama || "",
          // Additional info
          about: d.about || "",
          jasa_kirim: d.jasa_kirim || false,
        };

        // Always fetch rejection comments (for both store and products)
        if (user) {
          try {
            const rejectionResponse = await fetch(
              `${API_BASE_URL}/umkm/rejection-comments`,
              {
                headers: {
                  "X-User-ID": user.id.toString(),
                },
              }
            );
            const rejectionData = await rejectionResponse.json();

            if (rejectionData.success) {
              // Get UMKM rejection comment
              if (rejectionData.data.umkm_comments?.length > 0) {
                const latestComment = rejectionData.data.umkm_comments[0];
                submissionData.rejection_reason = latestComment.comment;
              }

              // Map product rejection comments to products
              if (rejectionData.data.product_comments?.length > 0) {
                const productComments = rejectionData.data.product_comments;
                submissionData.products = submissionData.products?.map(product => {
                  // Find rejection comment for this product (handle both string and number IDs)
                  const comment = productComments.find(
                    (c: any) =>
                      c.kodeproduk === `P${product.id}` ||
                      String(c.product_id) === String(product.id)
                  );
                  return {
                    ...product,
                    rejection_comment: comment?.comment || null
                  };
                });
              }
            }
          } catch (rejErr) {
            console.error("Error fetching rejection comments:", rejErr);
          }
        }

        console.log("Parsed submission data:", submissionData);
        setSubmission(submissionData);

        // Auto-refresh user data if status is approved
        if (submissionData.status === 'approved' && refreshUser) {
          await refreshUser();
        }
      } else {
        setError("Belum ada pengajuan toko");
      }
    } catch (err) {
      console.error("Error fetching submission status:", err);
      setError("Gagal memuat status pengajuan");
    } finally {
      setLoading(false);
    }
  };

  const toggleProductExpanded = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  // Start editing a product
  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setEditForm({
      nama_produk: product.nama_produk,
      deskripsi: product.deskripsi || '',
      harga: product.harga,
      kategori: product.kategori || '',
    });
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingProduct(null);
    setEditForm({ nama_produk: '', deskripsi: '', harga: 0, kategori: '' });
  };

  // Submit edited product for re-review
  const handleEditSubmit = async () => {
    if (!editingProduct || !user) return;

    // Validation
    if (!editForm.nama_produk.trim()) {
      alert('Nama produk harus diisi');
      return;
    }
    if (!editForm.deskripsi.trim()) {
      alert('Deskripsi produk harus diisi');
      return;
    }
    if (editForm.harga <= 0) {
      alert('Harga harus lebih dari 0');
      return;
    }
    if (!editForm.kategori.trim()) {
      alert('Kategori produk harus diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/${editingProduct.id}/resubmit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.id.toString(),
          },
          body: JSON.stringify({
            nama_produk: editForm.nama_produk,
            deskripsi: editForm.deskripsi,
            harga: editForm.harga,
            kategori: editForm.kategori,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Produk berhasil diperbarui dan dikirim ulang untuk review!');
        cancelEdit();
        fetchSubmissionStatus();
      } else {
        alert(data.message || 'Gagal mengirim ulang produk');
      }
    } catch (err) {
      console.error('Error resubmitting product:', err);
      alert('Terjadi kesalahan saat mengirim ulang');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing store
  const startEditStore = () => {
    if (!submission) return;
    setStoreEditForm({
      nama_toko: submission.nama_toko,
      nama_pemilik: submission.nama_pemilik,
      alamat_toko: submission.alamat_toko,
      whatsapp: submission.whatsapp,
      // Paroki info
      paroki: submission.paroki || '',
      umat: submission.umat || '',
      // Bank info
      nama_bank: submission.nama_bank || '',
      no_rekening: submission.no_rekening || '',
      atas_nama: submission.atas_nama || '',
      // Additional info
      about: submission.about || '',
      jasa_kirim: submission.jasa_kirim || false,
    });
    setIsEditingStore(true);
  };

  // Cancel store editing
  const cancelStoreEdit = () => {
    setIsEditingStore(false);
    setStoreEditForm({
      nama_toko: '', nama_pemilik: '', alamat_toko: '', whatsapp: '',
      paroki: '', umat: '', nama_bank: '', no_rekening: '', atas_nama: '',
      about: '', jasa_kirim: false
    });
  };

  // Submit edited store for re-review
  const handleStoreEditSubmit = async () => {
    if (!submission || !user) return;

    // Validation
    if (!storeEditForm.nama_toko.trim()) {
      alert('Nama toko harus diisi');
      return;
    }
    if (!storeEditForm.nama_pemilik.trim()) {
      alert('Nama pemilik harus diisi');
      return;
    }
    if (!storeEditForm.alamat_toko.trim()) {
      alert('Alamat toko harus diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/umkm/${submission.id}/resubmit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': user.id.toString(),
          },
          body: JSON.stringify({
            nama_toko: storeEditForm.nama_toko,
            nama_pemilik: storeEditForm.nama_pemilik,
            alamat_toko: storeEditForm.alamat_toko,
            whatsapp: storeEditForm.whatsapp,
            // Paroki info
            paroki: storeEditForm.paroki,
            umat: storeEditForm.umat,
            // Bank info
            nama_bank: storeEditForm.nama_bank,
            no_rekening: storeEditForm.no_rekening,
            atas_nama: storeEditForm.atas_nama,
            // Additional info
            about: storeEditForm.about,
            jasa_kirim: storeEditForm.jasa_kirim,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Toko berhasil diperbarui dan dikirim ulang untuk review!');
        cancelStoreEdit();
        fetchSubmissionStatus();
      } else {
        alert(data.message || 'Gagal mengirim ulang toko');
      }
    } catch (err) {
      console.error('Error resubmitting store:', err);
      alert('Terjadi kesalahan saat mengirim ulang');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-12 h-12 text-yellow-500" />;
      case "approved":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "rejected":
        return <XCircle className="w-12 h-12 text-red-500" />;
      default:
        return <Store className="w-12 h-12 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Menunggu Persetujuan";
      case "approved":
        return "Disetujui";
      case "rejected":
        return "Ditolak";
      default:
        return "Tidak Diketahui";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "approved":
        return "bg-green-100 text-green-800 border-green-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden p-6 relative shadow-2xl flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <X className="size-5" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          Status Pengajuan Toko
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600 dark:text-gray-400 mt-4">Memuat status...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">{error}</p>
            <button
              onClick={onClose}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Tutup
            </button>
          </div>
        ) : submission ? (
          <div className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)] pr-2">
            {/* Status Badge */}
            <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex justify-center mb-4">
                {getStatusIcon(submission.status)}
              </div>
              <span
                className={`inline-block px-6 py-3 rounded-full text-lg font-semibold border-2 ${getStatusColor(
                  submission.status
                )}`}
              >
                {getStatusText(submission.status)}
              </span>
            </div>

            {/* Submission Details */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Detail Pengajuan
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Nama Toko
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {submission.nama_toko}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Nama Pemilik
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {submission.nama_pemilik}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Alamat Toko
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {submission.alamat_toko}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Kategori
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {submission.category?.nama_kategori || "-"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                    Nomor WhatsApp
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {submission.whatsapp || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* Produk yang Diajukan */}
            {submission.products && submission.products.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Produk yang Diajukan ({submission.products.length})
                </h3>
                <div className="space-y-3">
                  {submission.products.map((product) => {
                    const isRejected = (product.approval_status || product.status) === "rejected" ||
                      (product.approval_status || product.status) === "inactive";
                    const isExpanded = expandedProducts.has(product.id);
                    const hasComment = product.rejection_comment;

                    return (
                      <div
                        key={product.id}
                        className="bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 overflow-hidden"
                      >
                        <div
                          className={`flex items-center justify-between p-3 ${isRejected && hasComment ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-550' : ''}`}
                          onClick={() => isRejected && hasComment && toggleProductExpanded(product.id)}
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 dark:text-white">
                              {product.nama_produk}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Rp {Number(product.harga).toLocaleString("id-ID")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${(product.approval_status || product.status) === "active" ||
                                (product.approval_status || product.status) === "approved"
                                ? "bg-green-100 text-green-800"
                                : isRejected
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                                }`}
                            >
                              {(product.approval_status || product.status) === "active" ||
                                (product.approval_status || product.status) === "approved"
                                ? "Disetujui"
                                : isRejected
                                  ? "Ditolak"
                                  : "Menunggu"}
                            </span>
                            {isRejected && hasComment && (
                              isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              )
                            )}
                          </div>
                        </div>

                        {/* Rejection Comment Dropdown */}
                        {isRejected && hasComment && isExpanded && (
                          <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-500">
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
                              <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                                Alasan Penolakan:
                              </p>
                              <p className="text-sm text-red-700 dark:text-red-200">
                                {product.rejection_comment}
                              </p>
                            </div>
                            {/* Tombol Edit & Kirim Ulang */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditProduct(product);
                              }}
                              className="mt-3 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                              ✏️ Edit & Kirim Ulang
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Status Messages */}
            <div
              className={`p-4 rounded-xl border-2 ${submission.status === "pending"
                ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20"
                : submission.status === "approved"
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20"
                  : "bg-red-50 border-red-200 dark:bg-red-900/20"
                }`}
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {submission.status === "pending" && (
                  <>
                    📋 Pengajuan Anda sedang dalam proses review oleh admin. Mohon
                    tunggu pemberitahuan lebih lanjut.
                  </>
                )}
                {submission.status === "approved" && (
                  <>
                    🎉 Selamat! Pengajuan toko Anda telah disetujui. Toko Anda
                    sekarang aktif dan dapat dilihat oleh pelanggan.
                  </>
                )}
                {submission.status === "rejected" && (
                  <div className="space-y-2">
                    <p>❌ Pengajuan toko Anda ditolak.</p>
                    {submission.rejection_reason && (
                      <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <p className="font-semibold text-red-800 dark:text-red-300 mb-1">Alasan Penolakan:</p>
                        <p className="text-red-700 dark:text-red-200">{submission.rejection_reason}</p>
                      </div>
                    )}
                    {/* Edit & Kirim Ulang Toko Button */}
                    <button
                      onClick={startEditStore}
                      className="mt-3 w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      ✏️ Edit & Kirim Ulang Toko
                    </button>
                  </div>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={fetchSubmissionStatus}
                className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
              >
                Refresh Status
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Produk
              </h3>
              <button
                onClick={cancelEdit}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Product Image Preview */}
              {editingProduct.gambar && (
                <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <img
                    src={editingProduct.gambar.startsWith('data:') || editingProduct.gambar.startsWith('http')
                      ? editingProduct.gambar
                      : `${BASE_HOST}/${editingProduct.gambar}`}
                    alt={editingProduct.nama_produk}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="%23ccc"><rect width="24" height="24"/></svg>';
                    }}
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {editingProduct.nama_produk}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Rp {Number(editingProduct.harga).toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              )}

              {/* Rejection Reason Reminder */}
              {editingProduct.rejection_comment && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                    ⚠️ Alasan Penolakan:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-200">
                    {editingProduct.rejection_comment}
                  </p>
                </div>
              )}
              {/* Nama Produk */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Produk *
                </label>
                <input
                  type="text"
                  value={editForm.nama_produk}
                  onChange={(e) => setEditForm({ ...editForm, nama_produk: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nama produk"
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deskripsi *
                </label>
                <textarea
                  value={editForm.deskripsi}
                  onChange={(e) => setEditForm({ ...editForm, deskripsi: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Deskripsi produk"
                />
              </div>

              {/* Harga */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Harga (Rp) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={editForm.harga ? Number(editForm.harga).toLocaleString('id-ID') : ''}
                  onChange={(e) => { const val = e.target.value.replace(/[^0-9]/g, ''); setEditForm({ ...editForm, harga: val === '' ? 0 : Number(val) }); }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Contoh: 50.000"
                />
              </div>

              {/* Kategori */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Kategori *
                </label>
                <input
                  type="text"
                  value={editForm.kategori}
                  onChange={(e) => setEditForm({ ...editForm, kategori: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Kategori produk"
                />
              </div>

              {/* Info */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Perbaiki produk Anda sesuai alasan penolakan, lalu kirim ulang untuk review.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={cancelEdit}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span> Mengirim...
                    </>
                  ) : (
                    <>🚀 Kirim Ulang</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {isEditingStore && submission && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Edit Toko UMKM
              </h3>
              <button
                onClick={cancelStoreEdit}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Rejection Reason Reminder */}
              {submission.rejection_reason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-800 dark:text-red-300 mb-1">
                    ⚠️ Alasan Penolakan:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-200">
                    {submission.rejection_reason}
                  </p>
                </div>
              )}

              {/* Nama Toko */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Toko *
                </label>
                <input
                  type="text"
                  value={storeEditForm.nama_toko}
                  onChange={(e) => setStoreEditForm({ ...storeEditForm, nama_toko: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nama toko"
                />
              </div>

              {/* Nama Pemilik */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Pemilik *
                </label>
                <input
                  type="text"
                  value={storeEditForm.nama_pemilik}
                  onChange={(e) => setStoreEditForm({ ...storeEditForm, nama_pemilik: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Nama pemilik"
                />
              </div>

              {/* Alamat Toko */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alamat Toko *
                </label>
                <textarea
                  value={storeEditForm.alamat_toko}
                  onChange={(e) => setStoreEditForm({ ...storeEditForm, alamat_toko: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  placeholder="Alamat toko"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={storeEditForm.whatsapp}
                  onChange={(e) => setStoreEditForm({ ...storeEditForm, whatsapp: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              {/* Divider - Paroki Info */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">⛪ Informasi Paroki</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Paroki</label>
                    <input
                      type="text"
                      value={storeEditForm.paroki}
                      onChange={(e) => setStoreEditForm({ ...storeEditForm, paroki: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="Nama paroki"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Umat</label>
                    <input
                      type="text"
                      value={storeEditForm.umat}
                      onChange={(e) => setStoreEditForm({ ...storeEditForm, umat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="Nama umat"
                    />
                  </div>
                </div>
              </div>

              {/* Divider - Bank Info */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">🏦 Informasi Rekening</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Bank</label>
                    <input
                      type="text"
                      value={storeEditForm.nama_bank}
                      onChange={(e) => setStoreEditForm({ ...storeEditForm, nama_bank: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      placeholder="BCA, BRI, Mandiri, dll"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">No. Rekening</label>
                      <input
                        type="text"
                        value={storeEditForm.no_rekening}
                        onChange={(e) => setStoreEditForm({ ...storeEditForm, no_rekening: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Atas Nama</label>
                      <input
                        type="text"
                        value={storeEditForm.atas_nama}
                        onChange={(e) => setStoreEditForm({ ...storeEditForm, atas_nama: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder="Nama pemilik rekening"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Divider - Additional Info */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">ℹ️ Info Tambahan</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">About / Tentang Toko</label>
                    <textarea
                      value={storeEditForm.about}
                      onChange={(e) => setStoreEditForm({ ...storeEditForm, about: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
                      placeholder="Deskripsi singkat tentang toko"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="jasa_kirim"
                      checked={storeEditForm.jasa_kirim}
                      onChange={(e) => setStoreEditForm({ ...storeEditForm, jasa_kirim: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="jasa_kirim" className="text-sm text-gray-700 dark:text-gray-300">
                      Menyediakan Jasa Kirim
                    </label>
                  </div>
                </div>
              </div>

              {/* Info */}
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Perbaiki data toko Anda sesuai alasan penolakan, lalu kirim ulang untuk review.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={cancelStoreEdit}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleStoreEditSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">⏳</span> Mengirim...
                    </>
                  ) : (
                    <>🚀 Kirim Ulang Toko</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
