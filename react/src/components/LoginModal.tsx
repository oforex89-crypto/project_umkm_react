import React, { useState, useEffect, useCallback } from "react";
import { X, CheckCircle, XCircle, Loader2, Eye, EyeOff, ArrowLeft, KeyRound, MessageCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { WhatsAppOtpModal } from "./WhatsAppOtpModal";
import { API_BASE_URL } from "../config/api";

// Declare Google Identity Services type
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
          renderButton: (element: HTMLElement, config: any) => void;
        };
      };
    };
  }
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [createAsAdmin, setCreateAsAdmin] = useState(false);
  const [isSettingUpAdmin, setIsSettingUpAdmin] = useState(false);
  const [showWhatsAppOtp, setShowWhatsAppOtp] = useState(false);
  const [whatsAppOtpType, setWhatsAppOtpType] = useState<"user" | "business">(
    "user"
  );
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<"email" | "phone">("email");
  // State untuk menyimpan data form sebelum 2FA verification
  const [pendingRegistration, setPendingRegistration] = useState<{
    email: string;
    password: string;
    name: string;
    type: "user" | "business";
  } | null>(null);

  // Email validation states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"idle" | "available" | "taken" | "invalid">("idle");
  const [emailMessage, setEmailMessage] = useState("");

  // Forgot password states
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1); // 1=email, 2=OTP, 3=new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotMaskedPhone, setForgotMaskedPhone] = useState("");
  const [forgotOtpCode, setForgotOtpCode] = useState("");
  const [forgotWaLink, setForgotWaLink] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Helper: load Google Identity Services script and wait for it
  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Already loaded
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      // Check if script tag already exists
      const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');

      if (!existingScript) {
        // Dynamically add the script
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          // Wait a bit for google object to initialize
          const check = setInterval(() => {
            if (window.google?.accounts?.id) {
              clearInterval(check);
              resolve();
            }
          }, 100);
          setTimeout(() => { clearInterval(check); reject(new Error('timeout')); }, 5000);
        };
        script.onerror = () => reject(new Error('script_error'));
        document.head.appendChild(script);
      } else {
        // Script exists but not loaded yet, wait for it
        const check = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(check);
            resolve();
          }
        }, 100);
        setTimeout(() => { clearInterval(check); reject(new Error('timeout')); }, 5000);
      }
    });
  };

  // Google Sign-In handler
  const handleGoogleLogin = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error("Google Client ID belum dikonfigurasi. Hubungi administrator.");
      return;
    }

    setIsGoogleLoading(true);

    try {
      // Wait for Google script to load
      await loadGoogleScript();

      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          try {
            if (response.credential) {
              await signInWithGoogle(response.credential);
              toast.success("Berhasil masuk dengan Google!");
              onClose();
            } else {
              toast.error("Login Google gagal. Coba lagi.");
            }
          } catch (error: any) {
            toast.error(error.message || "Gagal login dengan Google");
          } finally {
            setIsGoogleLoading(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google!.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsGoogleLoading(false);
          toast.info("Popup Google diblokir. Coba nonaktifkan popup blocker.");
        }
      });
    } catch (error: any) {
      setIsGoogleLoading(false);
      if (error.message === 'timeout') {
        toast.error("Google Sign-In gagal dimuat. Coba muat ulang halaman.");
      } else {
        toast.error("Gagal membuka Google Sign-In. Periksa koneksi internet.");
      }
    }
  };

  // Handler saat nomor WhatsApp sudah terdaftar — switch ke login mode
  const handleSwitchToLogin = () => {
    setShowWhatsAppOtp(false);
    setPendingRegistration(null);
    setIsSignUp(false);
    setEmail("");
    setPassword("");
  };

  // Debounce function for email check
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Check email availability
  const checkEmailAvailability = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes("@")) {
      setEmailStatus("idle");
      setEmailMessage("");
      return;
    }

    setIsCheckingEmail(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailToCheck }),
      });

      const data = await response.json();

      if (data.available) {
        setEmailStatus("available");
        setEmailMessage("✓ Email tersedia");
      } else {
        setEmailStatus("taken");
        setEmailMessage("✗ Email sudah terdaftar");
      }
    } catch (error) {
      console.error("Error checking email:", error);
      setEmailStatus("idle");
      setEmailMessage("");
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Debounced email check (500ms delay)
  const debouncedCheckEmail = useCallback(
    debounce((emailValue: string) => {
      if (isSignUp) {
        checkEmailAvailability(emailValue);
      }
    }, 500),
    [isSignUp]
  );

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);

    if (isSignUp && newEmail.includes("@")) {
      setEmailStatus("idle");
      setEmailMessage("");
      debouncedCheckEmail(newEmail);
    } else {
      setEmailStatus("idle");
      setEmailMessage("");
    }
  };

  if (!isOpen) return null;


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // REGISTRASI - Validasi form dulu
        if (!name.trim()) {
          toast.error("Nama harus diisi");
          setIsLoading(false);
          return;
        }
        if (!email.trim()) {
          toast.error("Email harus diisi");
          setIsLoading(false);
          return;
        }
        if (!password.trim() || password.length < 6) {
          toast.error("Password minimal 6 karakter");
          setIsLoading(false);
          return;
        }

        // Check if email is already taken
        if (emailStatus === "taken") {
          toast.error("Email sudah terdaftar. Silakan gunakan email lain atau login.");
          setIsLoading(false);
          return;
        }

        // Tentukan tipe akun (user atau business/UMKM)
        const registrationType = createAsAdmin ? "business" : "user";

        // Simpan data form untuk nanti setelah 2FA verified
        setPendingRegistration({
          email,
          password,
          name,
          type: registrationType,
        });

        // Trigger WhatsApp 2FA modal
        setWhatsAppOtpType(registrationType);
        setShowWhatsAppOtp(true);
        toast.info("📱 Silakan verifikasi nomor WhatsApp Anda");
      } else {
        // LOGIN - kirim credential apa adanya, backend handle format
        await signIn(email.trim(), password);
        toast.success("Berhasil masuk!");
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setEmail("");
    setPassword("");
    setName("");
    setCreateAsAdmin(false);
    // Reset WhatsApp state juga
    setVerifiedPhoneNumber("");
    setPhoneNumber("");
    setShowWhatsAppOtp(false);
    setPendingRegistration(null);
    // Reset email validation states
    setEmailStatus("idle");
    setEmailMessage("");
    setIsCheckingEmail(false);
    // Reset forgot password
    setForgotMode(false);
    setForgotStep(1);
  };

  // === FORGOT PASSWORD HANDLERS ===
  const resetForgotState = () => {
    setForgotMode(false);
    setForgotStep(1);
    setForgotEmail("");
    setForgotOtp("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotPhone("");
    setForgotMaskedPhone("");
    setForgotOtpCode("");
    setForgotWaLink("");
    setForgotLoading(false);
  };

  // Step 1: Submit email to get OTP
  const handleForgotSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await response.json();
      if (data.success) {
        setForgotPhone(data.data.phone_number);
        setForgotMaskedPhone(data.data.masked_phone);
        setForgotOtpCode(data.data.code);
        setForgotWaLink(data.data.wa_link);
        setForgotStep(2);
        toast.success(`OTP dikirim ke WhatsApp ${data.data.masked_phone}`);
      } else {
        toast.error(data.message || "Email tidak ditemukan");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleForgotVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotOtp.length !== 6) {
      toast.error("Kode OTP harus 6 digit");
      return;
    }
    // OTP is verified on the server when resetting, but we validate locally first
    if (forgotOtp === forgotOtpCode) {
      setForgotStep(3);
      toast.success("Kode OTP benar! Silakan buat password baru.");
    } else {
      toast.error("Kode OTP salah. Periksa kembali.");
    }
  };

  // Step 3: Reset password
  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error("Password dan konfirmasi tidak sama");
      return;
    }
    setForgotLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          phone_number: forgotPhone,
          code: forgotOtp,
          new_password: forgotNewPassword,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Password berhasil direset! Silakan login.");
        setEmail(forgotEmail);
        setPassword("");
        resetForgotState();
      } else {
        toast.error(data.message || "Gagal reset password");
      }
    } catch (error: any) {
      toast.error("Terjadi kesalahan. Coba lagi.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle WhatsApp 2FA verification success
  const handleWhatsAppOtpSuccess = async (phoneNumber: string) => {
    if (!pendingRegistration) {
      toast.error("Data registrasi tidak ditemukan");
      return;
    }

    try {
      console.log("OTP verified! Account successfully created");
      console.log("Registered email:", pendingRegistration.email);

      // PENTING: Jangan auto-login karena mungkin akun sudah ada sebelumnya
      // User harus login manual dengan password yang benar
      toast.success(
        "Akun berhasil diverifikasi! Silakan login dengan email dan password Anda."
      );

      // Pre-fill email untuk memudahkan user
      setEmail(pendingRegistration.email);
      setPassword(""); // Kosongkan password, user harus input
      setIsSignUp(false); // Switch ke login mode
      setShowWhatsAppOtp(false);

      // Clear registration data
      setName("");
      setCreateAsAdmin(false);
      setVerifiedPhoneNumber("");
      setPhoneNumber("");
      setPendingRegistration(null);

      // JANGAN close modal, biarkan user login manual
    } catch (error: any) {
      console.error("Error during verification:", error);
      toast.error(error.message || "Gagal memverifikasi OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close when clicking backdrop
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 relative shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
        >
          <X className="size-5" />
        </button>

        <h2 className="mb-6 text-gray-900 dark:text-white">
          {forgotMode ? "Reset Password" : isSignUp ? "Daftar Akun" : "Masuk"}
        </h2>

        {forgotMode ? (
          // FORGOT PASSWORD FLOW
          <div className="space-y-4">
            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3].map((step) => (
                <React.Fragment key={step}>
                  <div className={`flex items-center justify-center size-8 rounded-full text-sm font-bold transition-all ${forgotStep >= step
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
                    }`}>
                    {step}
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-0.5 transition-all ${forgotStep > step ? "bg-indigo-600" : "bg-gray-200 dark:bg-gray-600"
                      }`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {forgotStep === 1 && (
              // Step 1: Enter email
              <form onSubmit={handleForgotSubmitEmail} className="space-y-4">
                <div className="text-center mb-2">
                  <KeyRound className="size-10 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Masukkan email akun Anda. Kami akan mengirim kode OTP ke WhatsApp terdaftar.
                  </p>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    placeholder="nama@email.com"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? "Memproses..." : "Kirim Kode OTP"}
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              // Step 2: Verify OTP
              <form onSubmit={handleForgotVerifyOtp} className="space-y-4">
                <div className="text-center mb-2">
                  <KeyRound className="size-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Masukkan kode OTP berikut untuk verifikasi
                  </p>
                </div>

                {/* Show OTP code directly */}
                <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-xl p-4 text-center">
                  <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">📋 Kode Verifikasi Anda</p>
                  <p className="text-3xl font-mono font-bold text-green-800 dark:text-green-300 tracking-[0.5em] select-all">{forgotOtpCode}</p>
                  <p className="text-xs text-green-500 dark:text-green-500 mt-2">Salin kode di atas dan masukkan di bawah</p>
                </div>

                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Masukkan Kode OTP</label>
                  <input
                    type="text"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center text-xl tracking-[0.5em] font-mono"
                    required
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotOtp.length !== 6}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  Verifikasi OTP
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              // Step 3: Set new password
              <form onSubmit={handleForgotResetPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <CheckCircle className="size-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    OTP terverifikasi! Silakan buat password baru.
                  </p>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                      placeholder="Minimal 6 karakter"
                      minLength={6}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showNewPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Konfirmasi Password</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${forgotConfirmPassword && forgotConfirmPassword !== forgotNewPassword
                      ? "border-red-500"
                      : forgotConfirmPassword && forgotConfirmPassword === forgotNewPassword
                        ? "border-green-500"
                        : "border-gray-300 dark:border-gray-600"
                      }`}
                    required
                    placeholder="Ulangi password baru"
                    minLength={6}
                  />
                  {forgotConfirmPassword && forgotConfirmPassword !== forgotNewPassword && (
                    <p className="text-sm text-red-500 mt-1">Password tidak sama</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading || forgotNewPassword.length < 6 || forgotNewPassword !== forgotConfirmPassword}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? "Memproses..." : "Reset Password"}
                </button>
              </form>
            )}

            {/* Back to login */}
            <button
              type="button"
              onClick={resetForgotState}
              className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mt-2"
            >
              <ArrowLeft className="size-4" />
              Kembali ke halaman login
            </button>
          </div>
        ) : !isSignUp ? (
          // LOGIN FORM
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Email / No. Telepon</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                placeholder="nama@email.com atau 08xxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setForgotMode(true); setForgotStep(1); }}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Lupa Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">atau</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-400 dark:hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isGoogleLoading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <svg className="size-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span className="font-medium">
                {isGoogleLoading ? "Memproses..." : "Masuk dengan Google"}
              </span>
            </button>
          </form>
        ) : (
          // REGISTRATION FORM
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${emailStatus === "available"
                    ? "border-green-500 focus:ring-green-500"
                    : emailStatus === "taken"
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                    }`}
                  required
                  placeholder="nama@email.com"
                />
                {/* Status indicator */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {isCheckingEmail && (
                    <Loader2 className="size-5 text-gray-400 animate-spin" />
                  )}
                  {!isCheckingEmail && emailStatus === "available" && (
                    <CheckCircle className="size-5 text-green-500" />
                  )}
                  {!isCheckingEmail && emailStatus === "taken" && (
                    <XCircle className="size-5 text-red-500" />
                  )}
                </div>
              </div>
              {/* Status message */}
              {emailMessage && (
                <p className={`text-sm mt-1 ${emailStatus === "available" ? "text-green-600" : "text-red-600"
                  }`}>
                  {emailMessage}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-2 text-gray-700 dark:text-gray-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
            </div>

            {/* Phone number removed - will be captured from WhatsApp OTP verification */}



            <button
              type="submit"
              disabled={isLoading || emailStatus === "taken" || isCheckingEmail}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Memproses..." : isCheckingEmail ? "Memeriksa email..." : emailStatus === "taken" ? "Email sudah terdaftar" : "Daftar"}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              💡 Setelah klik "Daftar", Anda akan diminta verifikasi nomor
              WhatsApp
            </p>
          </form>
        )}

        {!forgotMode && (
          <div className="mt-6 text-center space-y-4">
            {!isSignUp && (
              <button
                type="button"
                onClick={toggleMode}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm"
              >
                Belum punya akun? Daftar di sini
              </button>
            )}

            {isSignUp && (
              <button
                type="button"
                onClick={toggleMode}
                className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm mb-4"
              >
                Sudah punya akun? Masuk di sini
              </button>
            )}
          </div>
        )}

        {/* WhatsApp 2FA Modal - Triggered setelah user klik "Daftar" */}
        <WhatsAppOtpModal
          isOpen={showWhatsAppOtp}
          onClose={() => {
            setShowWhatsAppOtp(false);
            setPendingRegistration(null);
          }}
          onSuccess={handleWhatsAppOtpSuccess}
          onSwitchToLogin={handleSwitchToLogin}
          type={whatsAppOtpType}
          registrationData={
            pendingRegistration
              ? {
                email: pendingRegistration.email,
                name: pendingRegistration.name,
                password: pendingRegistration.password,
              }
              : undefined
          }
        />
      </div>
    </div>
  );
}
