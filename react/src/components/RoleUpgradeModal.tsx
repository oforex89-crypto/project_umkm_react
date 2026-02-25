import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { API_BASE_URL } from "../config/api";

interface RoleUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RoleUpgradeModal({
  isOpen,
  onClose,
  onSuccess,
}: RoleUpgradeModalProps) {
  const { accessToken, refreshUser } = useAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if user already has a pending/rejected request
  useEffect(() => {
    const checkExistingRequest = async () => {
      try {
        const currentUser = localStorage.getItem("pasar_umkm_current_user");
        if (!currentUser) return;

        const user = JSON.parse(currentUser);

        // Skip for admin
        if (user.role === 'admin') {
          setCheckingExisting(false);
          return;
        }

        // Check for existing role upgrade request for this user
        const response = await fetch(
          `${API_BASE_URL}/role-upgrade/user/${user.id}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setExistingRequest(data.data);
          }
        }
      } catch (error) {
        // 404 means no existing request, which is fine
        console.log("No existing request found");
      } finally {
        setCheckingExisting(false);
      }
    };

    checkExistingRequest();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Block if already approved
    if (existingRequest && (existingRequest.status === "approved" || existingRequest.status_pengajuan === "approved")) {
      toast.info("Permintaan Anda sudah disetujui. Silakan buat toko UMKM Anda.");
      onClose();
      return;
    }

    if (!reason.trim()) {
      toast.error("Mohon jelaskan alasan permintaan upgrade role");
      return;
    }

    // Show confirm dialog if updating existing request
    if (existingRequest && existingRequest.status !== "approved") {
      setShowConfirm(true);
      return;
    }

    // Proceed with submission
    await submitRequest();
  };

  const submitRequest = async () => {
    setShowConfirm(false);
    setLoading(true);

    try {
      const currentUser = localStorage.getItem("pasar_umkm_current_user");
      if (!currentUser) {
        throw new Error("User tidak ditemukan");
      }

      const user = JSON.parse(currentUser);

      // Request data untuk role upgrade (simplified)
      const requestData = {
        user_id: user.id,
        reason: reason || "Ingin menjadi UMKM Owner", // Simple reason for role upgrade
      };

      const response = await fetch(`${API_BASE_URL}/role-upgrade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengajukan permintaan");
      }

      // Show different message based on whether it's new or updated
      const isUpdate = existingRequest && existingRequest.status !== "approved";
      toast.success(
        isUpdate
          ? "Permintaan berhasil diperbarui! Tunggu persetujuan admin."
          : "Permintaan upgrade role berhasil diajukan! Tunggu persetujuan admin."
      );

      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error submitting role upgrade:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mengajukan permintaan"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Custom Confirm Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ganti Permintaan Sebelumnya?
                  </h3>
                  <p className="text-sm text-gray-600 mb-1">
                    Anda sudah pernah mengajukan permintaan dengan status:{" "}
                    <span className="font-semibold capitalize text-gray-900">
                      {existingRequest.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Mengajukan lagi akan menggantikan permintaan sebelumnya dan
                    status akan kembali ke{" "}
                    <span className="font-semibold">pending</span>.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-lg">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={submitRequest}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ajukan Upgrade ke Role UMKM</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Info if request already approved */}
            {!checkingExisting &&
              existingRequest &&
              (existingRequest.status === "approved" || existingRequest.status_pengajuan === "approved") && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-green-900 font-medium mb-1">
                      Permintaan Anda sudah disetujui! 🎉
                    </p>
                    <p className="text-green-700">
                      Anda sudah dapat membuat toko UMKM. Silakan tutup modal ini dan buat toko Anda.
                    </p>
                  </div>
                </div>
              )}

            {/* Warning if user already has pending/rejected request */}
            {!checkingExisting &&
              existingRequest &&
              existingRequest.status !== "approved" &&
              existingRequest.status_pengajuan !== "approved" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-amber-900 font-medium mb-1">
                      Anda sudah pernah mengajukan permintaan
                    </p>
                    <p className="text-amber-700">
                      Status saat ini:{" "}
                      <span className="font-semibold capitalize">
                        {existingRequest.status || existingRequest.status_pengajuan}
                      </span>
                      <br />
                      Mengajukan lagi akan menggantikan permintaan sebelumnya
                      dan status akan kembali ke "pending".
                    </p>
                  </div>
                </div>
              )}

            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
              <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-2">Manfaat Role UMKM</h3>
              <ul className="text-sm text-orange-700 dark:text-orange-200 space-y-1">
                <li>• Dapat menambah toko/stan UMKM sendiri</li>
                <li>• Dapat menambah, edit, dan hapus produk Anda</li>
                <li>• Tetap dapat berbelanja dari UMKM lain</li>
                <li>• Mengelola bisnis secara mandiri</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label htmlFor="reason" className="block text-sm font-medium text-gray-800 dark:text-gray-200">
                Alasan Permintaan <span className="text-red-500 dark:text-red-400 font-bold">*</span>
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Jelaskan mengapa Anda ingin menjadi penjual UMKM di marketplace ini..."
                rows={5}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Jelaskan secara singkat tentang bisnis UMKM yang ingin Anda
                jalankan
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border-2 border-orange-500 dark:border-orange-400 text-orange-600 dark:text-orange-400 font-semibold rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                disabled={loading}
              >
                Batal
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Mengajukan..." : "Ajukan Permintaan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
