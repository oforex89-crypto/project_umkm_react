import { useState } from "react";
import { X, Loader, MessageCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { API_CONFIG } from "../config/api";

interface WhatsAppOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (phoneNumber: string) => void;
  type: "user" | "business"; // Jenis registrasi
  registrationData?: {
    email: string;
    name: string;
    password: string;
  };
}

export function WhatsAppOtpModal({
  isOpen,
  onClose,
  onSuccess,
  type,
  registrationData,
}: WhatsAppOtpModalProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [waLink, setWaLink] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");

  if (!isOpen) return null;

  // Format nomor WhatsApp (user inputs without leading 0, we add 62)
  const formatPhoneNumber = (phone: string) => {
    let formatted = phone.replace(/\D/g, ""); // Hapus non-digit

    // Jika mulai dengan 0, hapus 0 dan tambah 62
    if (formatted.startsWith("0")) {
      formatted = "62" + formatted.substring(1);
    }
    // Jika sudah mulai dengan 62, biarkan
    else if (formatted.startsWith("62")) {
      // Already correct format
    }
    // Jika mulai dengan angka lain (misal 8xx), tambah 62 di depan
    else if (formatted.length > 0) {
      formatted = "62" + formatted;
    }

    return formatted;
  };

  // Step 1: Kirim OTP ke WhatsApp
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      toast.error("Masukkan nomor WhatsApp Anda");
      return;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);

    // Validasi format
    if (!/^62[0-9]{9,12}$/.test(formattedPhone)) {
      toast.error("Format nomor tidak valid. Harus 62XXXXXXXXX (11-14 digit)");
      return;
    }

    setIsLoading(true);
    try {
      const endpoint =
        type === "user"
          ? "/auth/send-otp-register"
          : "/auth/send-otp-register"; // Both use same endpoint

      const apiUrl = `${API_CONFIG.BASE_URL}${endpoint}`;
      console.log("Calling API:", apiUrl);
      console.log("Phone number:", formattedPhone);

      // Add timeout to prevent stuck loading
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          no_whatsapp: formattedPhone,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      // Handle 409 Conflict - Nomor sudah terdaftar
      if (response.status === 409) {
        toast.error(
          "Nomor WhatsApp sudah terdaftar. Silakan login dengan akun yang sudah ada."
        );
        setIsLoading(false);
        return;
      }

      // Handle validation errors (422)
      if (response.status === 422) {
        toast.error(data.message || "Format nomor tidak valid");
        setIsLoading(false);
        return;
      }

      // Handle other errors
      if (!response.ok) {
        toast.error(data.message || `Error: ${response.status}`);
        setIsLoading(false);
        return;
      }

      if (data.success) {
        setGeneratedCode(data.data.code);
        setWaLink(data.data.wa_link);
        setStep("otp");
        toast.success("OTP dikirim! Buka WhatsApp untuk copy kodenya");
      } else {
        toast.error(data.message || "Gagal mengirim OTP");
      }
    } catch (error: any) {
      console.error("Error sending OTP:", error);

      if (error.name === "AbortError") {
        toast.error("Request timeout. Coba lagi.");
      } else if (error.message.includes("fetch")) {
        toast.error(
          "Tidak bisa terhubung ke server. Pastikan Laravel berjalan di localhost:8000"
        );
      } else {
        toast.error(`Error: ${error.message || "Network error"}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verifikasi OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submit
    if (isLoading) {
      console.log("Already processing, ignoring duplicate request");
      return;
    }

    if (otp.length !== 6) {
      toast.error("Kode OTP harus 6 digit");
      return;
    }

    // Validate registration data
    if (registrationData) {
      if (
        !registrationData.email ||
        !registrationData.name ||
        !registrationData.password
      ) {
        toast.error("Data registrasi tidak lengkap");
        return;
      }
      if (registrationData.password.length < 6) {
        toast.error("Password minimal 6 karakter");
        return;
      }
    }

    setIsLoading(true);
    try {
      const endpoint = "/api/auth/verify-otp-register";
      const formattedPhone = formatPhoneNumber(phoneNumber);

      const body: any = {
        no_whatsapp: formattedPhone,
        code: otp,
        type: type,
      };

      // Add registration data jika ada (untuk create account)
      if (registrationData) {
        body.email = registrationData.email.trim();
        body.nama = registrationData.name.trim();
        body.password = registrationData.password;
      }

      console.log("Verifying OTP dengan data:", { ...body, password: "***" });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/auth/verify-otp-register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log("Verify response status:", response.status);
      console.log("Verify response data:", data);

      if (!response.ok) {
        console.error("Verification failed:", data);
        setIsLoading(false); // Reset immediately on error

        // Handle specific error messages
        if (data.errors) {
          const errorMessages = Object.values(data.errors).flat().join(", ");
          toast.error(`Validasi gagal: ${errorMessages}`);
        } else if (data.message) {
          toast.error(data.message);
        } else {
          toast.error(`Gagal verifikasi (${response.status})`);
        }
        return; // Stop here on error
      }

      if (data.success) {
        console.log("✅ User berhasil dibuat:", data.data);
        toast.success("✅ Akun berhasil dibuat! Silakan login.");

        // Reset form
        setPhoneNumber("");
        setOtp("");
        setStep("phone");

        // Call success callback with verified data
        onSuccess(formatPhoneNumber(phoneNumber));

        // Close modal after short delay
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setIsLoading(false);
        toast.error(data.message || "Kode OTP tidak valid");
      }
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      setIsLoading(false);

      if (error.name === "AbortError") {
        toast.error("Request timeout. Silakan coba lagi.");
      } else {
        toast.error(
          "Gagal memverifikasi OTP: " + (error.message || "Network error")
        );
      }
    } finally {
      // Only reset if not already reset
      if (isLoading) {
        setIsLoading(false);
      }
    }
  };

  // Buka WhatsApp dengan pesan pre-filled
  const openWhatsAppWithMessage = () => {
    console.log("openWhatsAppWithMessage called");
    console.log("waLink:", waLink);
    console.log("generatedCode:", generatedCode);
    if (waLink) {
      console.log("Opening WhatsApp with link:", waLink);
      window.open(waLink, "_blank");
    } else {
      console.warn("waLink is empty!");
      toast.error("Link WhatsApp tidak tersedia");
    }
  };

  return (
    // Render di dalam LoginModal tanpa overlay tambahan (LoginModal sudah punya)
    <div className="fixed inset-0 flex items-center justify-center z-[999] pointer-events-none">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full mx-4 pointer-events-auto max-h-[90vh] overflow-y-auto border dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {type === "user" ? "Registrasi Pembeli" : "Registrasi UMKM"} via
            WhatsApp
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === "phone" ? (
            // Step 1: Input Nomor WhatsApp
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nomor WhatsApp
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600">
                    +62
                  </span>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) =>
                      setPhoneNumber(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="812345678901"
                    maxLength={13}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Contoh: 812345678901 (10-12 digit, tanpa 0 di depan)
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ Hanya nomor Indonesia yang didukung
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                {isLoading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <MessageCircle size={20} />
                    Kirim OTP
                  </>
                )}
              </button>

              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                Anda akan menerima kode OTP 6 digit di WhatsApp
              </p>
            </form>
          ) : (
            // Step 2: Input OTP
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle
                    size={20}
                    className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-300">
                      Tombol WhatsApp Terbuka
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-400">
                      Jika belum terbuka, klik tombol di bawah
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={openWhatsAppWithMessage}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition border-2 border-green-600"
              >
                <MessageCircle size={20} />
                Buka WhatsApp & Copy Kode
              </button>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Kode OTP (6 digit)
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e: any) =>
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Paste kode dari pesan WhatsApp yang Anda terima
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  {isLoading ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Verifikasi...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Verifikasi OTP
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                  }}
                  className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-semibold py-2"
                >
                  Kembali
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
