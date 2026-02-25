-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3303
-- Generation Time: Feb 25, 2026 at 05:04 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `dbumkm`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cart_items`
--

CREATE TABLE `cart_items` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `jumlah` int(11) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nama_kategori` varchar(100) NOT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `nama_kategori`, `icon`, `created_at`, `updated_at`) VALUES
(1, 'Kain & Batik', 'fabric', '2026-01-10 20:08:43', '2026-01-10 20:08:43'),
(2, 'Pakaian', 'shirt', NULL, NULL),
(3, 'Aksesoris', 'gem', NULL, NULL),
(4, 'Tas', 'bag', NULL, NULL),
(5, 'Makanan', 'utensils', NULL, NULL),
(6, 'Kerajinan', 'scissors', NULL, NULL),
(7, 'Fashion', 'shopping-bag', '2026-01-16 03:45:31', '2026-01-16 03:45:31'),
(8, 'Kuliner', 'utensils', '2026-01-16 03:45:31', '2026-01-16 03:45:31'),
(9, 'Kecantikan', 'sparkles', '2026-01-16 03:45:31', '2026-01-16 03:45:31'),
(10, 'UMKM', 'store', '2026-01-16 03:45:31', '2026-01-16 03:45:31');

-- --------------------------------------------------------

--
-- Table structure for table `event_images`
--

CREATE TABLE `event_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_code` varchar(20) NOT NULL,
  `image_path` varchar(500) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_participants`
--

CREATE TABLE `event_participants` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_id` varchar(20) NOT NULL,
  `user_id` varchar(20) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `organization` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `event_participants`
--

INSERT INTO `event_participants` (`id`, `event_id`, `user_id`, `name`, `email`, `phone`, `organization`, `notes`, `status`, `created_at`, `updated_at`) VALUES
(1, 'EVT002', NULL, 'd', 'd@gmail.com', '0851653637', NULL, NULL, 'confirmed', '2026-01-14 07:49:25', '2026-01-14 07:49:25'),
(2, 'EVT002', '1', 'Administrator', 'admin@umkm.com', '085175447465', NULL, NULL, 'confirmed', '2026-01-14 08:30:13', '2026-01-14 08:30:13'),
(3, 'EVT001', '3', 'Andi Wijaya', 'andi@customer.com', '081234567801', NULL, NULL, 'confirmed', '2026-01-14 19:26:17', '2026-01-14 19:26:17'),
(4, 'EVT002', '20', 'michael', 'micahel@gmail.com', '62851754607544', NULL, NULL, 'confirmed', '2026-01-21 23:00:00', '2026-01-21 23:00:00'),
(5, 'EVT002', '22', 'user7', 'user7@gmail.com', '085175447460', NULL, NULL, 'confirmed', '2026-02-09 03:43:14', '2026-02-09 03:43:14'),
(6, 'EVT002', '30', 'testumkm', 'testuserumkm@gmail.com', '6285600630252', NULL, NULL, 'confirmed', '2026-02-15 12:35:55', '2026-02-15 12:35:55');

-- --------------------------------------------------------

--
-- Table structure for table `event_products`
--

CREATE TABLE `event_products` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_id` varchar(20) NOT NULL,
  `vendor_registration_id` bigint(20) UNSIGNED NOT NULL,
  `umkm_id` bigint(20) UNSIGNED NOT NULL,
  `nama_produk` varchar(100) NOT NULL,
  `harga` decimal(12,2) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  `stok` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_vendor_registrations`
--

CREATE TABLE `event_vendor_registrations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `event_id` varchar(20) NOT NULL,
  `umkm_id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `products` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `admin_notes` text DEFAULT NULL,
  `agreement_file` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2025_12_20_132200_create_admins_table', 1),
(5, '2025_12_20_132300_create_categories_table', 1),
(6, '2025_12_20_132400_create_new_structure_tables', 1),
(7, '2025_12_20_134740_add_is_active_to_admins_table', 1),
(8, '2025_12_20_140229_add_status_to_users_table', 1),
(9, '2025_12_20_140644_add_phone_fields_to_users_table', 1),
(10, '2025_12_20_141151_create_wa_verifications_table', 1),
(11, '2025_12_20_141653_add_verified_fields_to_wa_verifications_table', 1),
(12, '2025_12_21_132432_add_foto_toko_to_tumkm_table', 1),
(13, '2025_12_21_132651_change_gambar_column_to_longtext_in_tproduk', 1),
(14, '2025_12_21_140000_add_about_me_to_tumkm_table', 1),
(15, '2026_01_07_222920_add_gambarproduk_to_tproduk_table', 2),
(16, '2026_01_07_223749_add_fototoko_to_tumkm_table', 3),
(17, '2026_01_08_000001_create_role_upgrade_requests_table', 4),
(18, '2026_01_08_014613_add_kategori_to_tproduk_table', 5),
(19, '2026_01_09_190441_create_product_rejection_reasons_table', 5),
(20, '2026_01_10_000000_create_product_rejection_comments_table', 5),
(21, '2026_01_10_add_columns_to_users_table', 6),
(22, '2026_01_10_create_users_table', 7),
(23, '2026_01_10_restructure_tpengguna_to_event_visitors', 8),
(24, '2026_01_11_035713_create_umkm_rejection_comments_table', 9),
(25, '2026_01_11_add_foto_toko_to_tumkm', 10),
(26, '2026_01_14_create_event_participants_table', 10),
(27, '2026_01_21_000001_create_orders_table', 10),
(28, '2026_01_21_add_catatan_pembayaran_to_orders_table', 11),
(29, '2026_01_22_add_paroki_umat_to_tumkm', 12),
(30, '2026_01_22_create_event_vendor_registrations_table', 12),
(31, '2026_01_27_add_priority_features_columns', 12),
(32, '2026_01_27_add_package_dates_to_tproduk', 13),
(33, '2026_02_07_add_category_to_notifications', 14),
(34, '2026_02_13_create_product_images_table', 15),
(35, '2026_02_13_create_event_images_table', 15),
(36, '2026_02_14_create_product_variants_tables', 16);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(50) NOT NULL,
  `category` varchar(20) NOT NULL DEFAULT 'personal',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `action_url` varchar(255) DEFAULT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `type`, `category`, `title`, `message`, `action_url`, `data`, `is_read`, `read_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'order', 'personal', 'Test Notification', 'Ini adalah test notifikasi', NULL, NULL, 1, '2026-02-06 10:08:03', '2026-02-06 10:00:36', '2026-02-06 10:08:03'),
(2, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Customer sebesar Rp 45.000', '/umkm-orders', '{\"order_id\":\"ORD-20260208-4x1QFn\"}', 1, '2026-02-08 03:56:27', '2026-02-08 03:55:28', '2026-02-08 03:56:27'),
(3, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Customer sebesar Rp 85.000', '/umkm-orders', '{\"order_id\":\"ORD-20260208-bbDV6F\"}', 1, '2026-02-08 04:03:08', '2026-02-08 04:02:54', '2026-02-08 04:03:08'),
(4, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Customer sebesar Rp 85.000', '/umkm-orders', '{\"order_id\":\"ORD-20260208-cfa99c\"}', 0, NULL, '2026-02-08 04:07:25', '2026-02-08 04:07:25'),
(5, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Customer sebesar Rp 85.000', '/umkm-orders', '{\"order_id\":\"ORD-20260208-5bSSIZ\"}', 1, '2026-02-08 04:31:18', '2026-02-08 04:07:26', '2026-02-08 04:31:18'),
(6, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Customer sebesar Rp 95.000', '/umkm-orders', '{\"order_id\":\"ORD-20260208-afNYSh\"}', 0, NULL, '2026-02-08 04:34:49', '2026-02-08 04:34:49'),
(7, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 95.000', '/umkm-orders', '{\"order_id\":\"ORD-20260208-v6efik\"}', 0, NULL, '2026-02-08 04:45:01', '2026-02-08 04:45:01'),
(8, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 95.000', '/umkm-orders', '{\"order_id\":\"ORD-20260208-lMLGCk\"}', 0, NULL, '2026-02-08 04:45:02', '2026-02-08 04:45:02'),
(9, 1, 'order', 'personal', '✅ Pesanan Dikonfirmasi', 'Pesanan Anda telah dikonfirmasi oleh 3', '/orders', '{\"order_id\":\"ORD-20260208-lMLGCk\"}', 1, '2026-02-09 02:53:35', '2026-02-08 04:47:29', '2026-02-09 02:53:35'),
(10, 1, 'order', 'personal', '📦 Pesanan Siap Diambil', 'Pesanan Anda di 3 siap untuk diambil!', '/orders', '{\"order_id\":\"ORD-20260208-lMLGCk\"}', 0, NULL, '2026-02-08 04:47:45', '2026-02-08 04:47:45'),
(11, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"rgrg\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"rgrg\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:03:25', '2026-02-08 06:03:25'),
(12, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"rgrg\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"rgrg\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:03:43', '2026-02-08 06:03:43'),
(13, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"rgrg\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"rgrg\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:06:16', '2026-02-08 06:06:16'),
(14, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"ee\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"ee\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:10:04', '2026-02-08 06:10:04'),
(15, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"rerr\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"rerr\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:13:53', '2026-02-08 06:13:53'),
(16, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"ttttt\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"ttttt\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:19:23', '2026-02-08 06:19:23'),
(17, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"wwwww\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"wwwww\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:22:14', '2026-02-08 06:22:14'),
(18, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"rrrrrr\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"rrrrrr\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:30:00', '2026-02-08 06:30:00'),
(19, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"dddddddddddd\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"dddddddddddd\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:34:19', '2026-02-08 06:34:19'),
(20, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"wwwwwwwwwwww\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"wwwwwwwwwwww\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:35:40', '2026-02-08 06:35:40'),
(21, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"rrrrrrrrrr\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"rrrrrrrrrr\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:43:37', '2026-02-08 06:43:37'),
(22, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"vvvvvvvvvvvvvvv\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"vvvvvvvvvvvvvvv\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:47:49', '2026-02-08 06:47:49'),
(23, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"rrrrrrrrrr\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"rrrrrrrrrr\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:55:16', '2026-02-08 06:55:16'),
(24, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"4444444444444444\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"4444444444444444\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 06:58:52', '2026-02-08 06:58:52'),
(25, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"qqqqqqqqqqqqqqqqqqq\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"qqqqqqqqqqqqqqqqqqq\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-08 07:08:07', '2026-02-08 07:08:07'),
(26, 20, 'rejection', 'store', '❌ Pendaftaran Event Ditolak', 'Pendaftaran toko Anda untuk event \"Workshop Digital Marketing untuk UMKM\" ditolak. Anda dapat mendaftar ulang dengan perbaikan.', NULL, '{\"event_name\":\"Workshop Digital Marketing untuk UMKM\",\"reason\":null}', 1, '2026-02-08 10:15:57', '2026-02-08 10:15:27', '2026-02-08 10:15:57'),
(27, 20, 'rejection', 'store', '❌ Pendaftaran Event Ditolak', 'Pendaftaran toko Anda untuk event \"Workshop Digital Marketing untuk UMKM\" ditolak. Anda dapat mendaftar ulang dengan perbaikan.', NULL, '{\"event_name\":\"Workshop Digital Marketing untuk UMKM\",\"reason\":null}', 0, NULL, '2026-02-08 10:17:10', '2026-02-08 10:17:10'),
(28, 20, 'rejection', 'store', '❌ Pendaftaran Event Ditolak', 'Pendaftaran toko Anda untuk event \"Workshop Digital Marketing untuk UMKM\" ditolak. Anda dapat mendaftar ulang dengan perbaikan.', NULL, '{\"event_name\":\"Workshop Digital Marketing untuk UMKM\",\"reason\":null}', 0, NULL, '2026-02-08 10:25:52', '2026-02-08 10:25:52'),
(29, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari user7 sebesar Rp 3.000', '/umkm-orders', '{\"order_id\":\"ORD-20260208-QTTDLu\"}', 1, '2026-02-08 10:36:41', '2026-02-08 10:35:18', '2026-02-08 10:36:41'),
(30, 3, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari michael sebesar Rp 8.500.000', '/umkm-orders', '{\"order_id\":\"ORD-20260209-zuCApq\"}', 0, NULL, '2026-02-09 02:55:19', '2026-02-09 02:55:19'),
(31, 3, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari michael sebesar Rp 8.500.000', '/umkm-orders', '{\"order_id\":\"ORD-20260209-fljVVx\"}', 0, NULL, '2026-02-09 02:55:27', '2026-02-09 02:55:27'),
(32, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari michael sebesar Rp 3.000', '/umkm-orders', '{\"order_id\":\"ORD-20260209-3p5ulk\"}', 1, '2026-02-09 02:56:30', '2026-02-09 02:56:04', '2026-02-09 02:56:30'),
(33, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari michael sebesar Rp 85.000', '/umkm-orders', '{\"order_id\":\"ORD-20260209-KPumAW\"}', 0, NULL, '2026-02-09 02:59:32', '2026-02-09 02:59:32'),
(34, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari michael sebesar Rp 45.000', '/umkm-orders', '{\"order_id\":\"ORD-20260209-dgG0au\"}', 0, NULL, '2026-02-09 03:09:20', '2026-02-09 03:09:20'),
(35, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari user7 sebesar Rp 95.000', '/umkm-orders', '{\"order_id\":\"ORD-20260209-H8Ff7v\"}', 0, NULL, '2026-02-09 03:11:56', '2026-02-09 03:11:56'),
(36, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari user7 sebesar Rp 85.000', '/umkm-orders', '{\"order_id\":\"ORD-20260209-pRdxXf\"}', 0, NULL, '2026-02-09 05:14:28', '2026-02-09 05:14:28'),
(37, 3, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari user7 sebesar Rp 1.500.000', '/umkm-orders', '{\"order_id\":\"ORD-20260209-HnlkTT\"}', 0, NULL, '2026-02-09 05:28:43', '2026-02-09 05:28:43'),
(38, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari user7 sebesar Rp 85.000', '/umkm-orders', '{\"order_id\":\"ORD-20260209-LJ9bwO\"}', 0, NULL, '2026-02-09 05:29:04', '2026-02-09 05:29:04'),
(39, 22, 'order', 'personal', '✅ Pesanan Dikonfirmasi', 'Pesanan Anda telah dikonfirmasi oleh Coffee', '/orders', '{\"order_id\":\"ORD-20260209-LJ9bwO\"}', 0, NULL, '2026-02-09 05:31:04', '2026-02-09 05:31:04'),
(40, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"dddd\" oleh user6 dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"dddd\",\"owner_name\":\"user6\",\"product_count\":1}', 0, NULL, '2026-02-12 18:22:35', '2026-02-12 18:22:35'),
(41, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"Tenun Indah\" oleh Rizky Pratama dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"Tenun Indah\",\"owner_name\":\"Rizky Pratama\",\"product_count\":1}', 0, NULL, '2026-02-12 18:38:05', '2026-02-12 18:38:05'),
(42, 20, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari michael sebesar Rp 3.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-yM796p\"}', 0, NULL, '2026-02-13 23:18:44', '2026-02-13 23:18:44'),
(43, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Dewi Lestari sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-gyEEpa\"}', 0, NULL, '2026-02-14 01:22:54', '2026-02-14 01:22:54'),
(44, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-MYDMEG\"}', 0, NULL, '2026-02-14 01:26:15', '2026-02-14 01:26:15'),
(45, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-8xgbKu\"}', 0, NULL, '2026-02-14 01:28:05', '2026-02-14 01:28:05'),
(46, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-JABLFQ\"}', 0, NULL, '2026-02-14 01:39:21', '2026-02-14 01:39:21'),
(47, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-jN6Rh9\"}', 0, NULL, '2026-02-14 01:42:17', '2026-02-14 01:42:17'),
(48, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Dewi Lestari sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-6Sb3QE\"}', 0, NULL, '2026-02-14 01:42:52', '2026-02-14 01:42:52'),
(49, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-aECnAC\"}', 0, NULL, '2026-02-14 02:01:02', '2026-02-14 02:01:02'),
(50, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-djIcAl\"}', 0, NULL, '2026-02-14 02:04:31', '2026-02-14 02:04:31'),
(51, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-HWoJnS\"}', 0, NULL, '2026-02-14 02:07:22', '2026-02-14 02:07:22'),
(52, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Administrator sebesar Rp 450.000', '/umkm-orders', '{\"order_id\":\"ORD-20260214-kHPyDP\"}', 0, NULL, '2026-02-14 02:21:09', '2026-02-14 02:21:09'),
(53, 6, 'order', 'personal', '✅ Pesanan Dikonfirmasi', 'Pesanan Anda telah dikonfirmasi oleh Tenun Ikat Sumba', '/orders', '{\"order_id\":\"ORD-20260214-6Sb3QE\"}', 0, NULL, '2026-02-14 03:05:53', '2026-02-14 03:05:53'),
(54, 6, 'order', 'personal', '📦 Pesanan Siap Diambil', 'Pesanan Anda di Tenun Ikat Sumba siap untuk diambil!', '/orders', '{\"order_id\":\"ORD-20260214-6Sb3QE\"}', 0, NULL, '2026-02-14 03:07:45', '2026-02-14 03:07:45'),
(55, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"Starbuck\" oleh Rizky Pratama dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"Starbuck\",\"owner_name\":\"Rizky Pratama\",\"product_count\":1}', 0, NULL, '2026-02-14 04:15:02', '2026-02-14 04:15:02'),
(56, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"Starbuck\" oleh Ahmad Fauzi dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"Starbuck\",\"owner_name\":\"Ahmad Fauzi\",\"product_count\":1}', 0, NULL, '2026-02-14 04:37:16', '2026-02-14 04:37:16'),
(57, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"Starbuck\" oleh Dewi Lestari dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"Starbuck\",\"owner_name\":\"Dewi Lestari\",\"product_count\":1}', 0, NULL, '2026-02-14 04:49:50', '2026-02-14 04:49:50'),
(58, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari Testuser sebesar Rp 5.100.000', '/umkm-orders', '{\"order_id\":\"ORD-20260215-doBLdv\"}', 0, NULL, '2026-02-15 11:55:16', '2026-02-15 11:55:16'),
(59, 6, 'order', 'store', '🛒 Pesanan Baru!', 'Pesanan baru dari testumkm sebesar Rp 750.000', '/umkm-orders', '{\"order_id\":\"ORD-20260215-Q3wZ6s\"}', 1, '2026-02-15 12:33:17', '2026-02-15 12:30:05', '2026-02-15 12:33:17'),
(60, 30, 'order', 'personal', '✅ Pesanan Dikonfirmasi', 'Pesanan Anda telah dikonfirmasi oleh Tenun Ikat Sumba', '/orders', '{\"order_id\":\"ORD-20260215-Q3wZ6s\"}', 0, NULL, '2026-02-15 12:34:01', '2026-02-15 12:34:01'),
(61, 30, 'order', 'personal', '📦 Pesanan Siap Diambil', 'Pesanan Anda di Tenun Ikat Sumba siap untuk diambil!', '/orders', '{\"order_id\":\"ORD-20260215-Q3wZ6s\"}', 0, NULL, '2026-02-15 12:34:29', '2026-02-15 12:34:29'),
(62, 19, 'umkm_registration', 'personal', '🏪 Pendaftaran UMKM Baru!', 'Toko \"Sambal Mbak Sri\" oleh Budi Santoso dengan 1 produk menunggu persetujuan.', '/admin-panel', '{\"store_name\":\"Sambal Mbak Sri\",\"owner_name\":\"Budi Santoso\",\"product_count\":1}', 0, NULL, '2026-02-15 12:50:29', '2026-02-15 12:50:29');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `business_id` varchar(50) NOT NULL,
  `no_whatsapp_pembeli` varchar(20) DEFAULT NULL,
  `catatan` text DEFAULT NULL,
  `catatan_pembayaran` text DEFAULT NULL,
  `bukti_pembayaran` varchar(255) DEFAULT NULL,
  `total_harga` decimal(12,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `status_umkm` varchar(50) DEFAULT NULL,
  `lokasi_pengambilan` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `order_number` varchar(100) DEFAULT NULL,
  `paid_at` timestamp NULL DEFAULT NULL,
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` varchar(50) NOT NULL,
  `order_id` varchar(50) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `jumlah` int(11) DEFAULT NULL,
  `harga_satuan` decimal(12,2) DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `image_path` varchar(500) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_rejection_comments`
--

CREATE TABLE `product_rejection_comments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kodeproduk` varchar(20) NOT NULL,
  `kodepengguna` varchar(20) NOT NULL,
  `comment` text NOT NULL,
  `status` enum('rejected','pending') NOT NULL DEFAULT 'rejected',
  `admin_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_rejection_comments`
--

INSERT INTO `product_rejection_comments` (`id`, `kodeproduk`, `kodepengguna`, `comment`, `status`, `admin_id`, `created_at`, `updated_at`) VALUES
(9, 'P38', 'U3', 'Produk tidak sesuai kategori yang diajukan', 'rejected', 1, '2026-01-10 22:14:53', '2026-01-10 22:14:53'),
(10, 'P7', 'U4', 'karena terlalu mahal', 'rejected', 1, '2026-01-10 22:18:18', '2026-01-10 22:18:18'),
(11, 'P8', 'U4', 'karena terlalu mahal', 'rejected', 1, '2026-01-10 22:18:25', '2026-01-10 22:18:25'),
(12, 'P9', 'U4', 'karena terlalu mahal', 'rejected', 1, '2026-01-10 22:18:29', '2026-01-10 22:18:29'),
(13, 'P10', 'U4', 'karena terlalu mahal', 'rejected', 1, '2026-01-10 22:18:33', '2026-01-10 22:18:33'),
(14, 'P10', 'U4', 'karena terlalu mahal', 'rejected', 1, '2026-01-10 22:18:33', '2026-01-10 22:18:33'),
(15, 'P10', 'U4', 'karena terlalu mahal', 'rejected', 1, '2026-01-10 22:18:36', '2026-01-10 22:18:36'),
(16, 'P11', 'U4', 'karena terlalu mahal', 'rejected', 1, '2026-01-10 22:18:45', '2026-01-10 22:18:45'),
(17, 'P12', 'U4', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:11', '2026-01-10 22:47:11'),
(18, 'P41', 'U4', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:11', '2026-01-10 22:47:11'),
(19, 'P13', 'U5', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:12', '2026-01-10 22:47:12'),
(20, 'P14', 'U5', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:12', '2026-01-10 22:47:12'),
(21, 'P15', 'U5', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:13', '2026-01-10 22:47:13'),
(22, 'P16', 'U5', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:13', '2026-01-10 22:47:13'),
(23, 'P17', 'U5', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:13', '2026-01-10 22:47:13'),
(24, 'P18', 'U5', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:14', '2026-01-10 22:47:14'),
(25, 'P19', 'U5', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:14', '2026-01-10 22:47:14'),
(26, 'P20', 'U6', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:22', '2026-01-10 22:47:22'),
(27, 'P21', 'U6', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:22', '2026-01-10 22:47:22'),
(28, 'P22', 'U6', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:22', '2026-01-10 22:47:22'),
(29, 'P23', 'U6', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:23', '2026-01-10 22:47:23'),
(30, 'P24', 'U6', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:23', '2026-01-10 22:47:23'),
(31, 'P25', 'U6', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:24', '2026-01-10 22:47:24'),
(32, 'P26', 'U7', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:24', '2026-01-10 22:47:24'),
(33, 'P27', 'U7', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:24', '2026-01-10 22:47:24'),
(34, 'P28', 'U7', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:25', '2026-01-10 22:47:25'),
(35, 'P29', 'U7', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:25', '2026-01-10 22:47:25'),
(36, 'P30', 'U7', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:25', '2026-01-10 22:47:25'),
(37, 'P31', 'U7', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:26', '2026-01-10 22:47:26'),
(38, 'P32', 'U7', 'berikan check box supaya bisa multiple produk langsung yang di tolak atau pun di approve', 'rejected', 1, '2026-01-10 22:47:26', '2026-01-10 22:47:26'),
(41, 'P252', 'U24', 'SERIUS JUALAN JEMBATAN', 'rejected', 1, '2026-01-14 20:06:10', '2026-01-14 20:06:10'),
(42, 'P255', 'U33', 'Mahal broo', 'rejected', 1, '2026-01-16 03:31:50', '2026-01-16 03:31:50'),
(45, 'P296', 'U35', 'ssssssdddddddddddddddddd', 'rejected', 1, '2026-02-08 07:27:28', '2026-02-08 07:27:28'),
(46, 'P302', 'U35', 'mshslaaaaaaaaaaaaa', 'rejected', 1, '2026-02-12 18:27:05', '2026-02-12 18:27:05'),
(49, 'P299', 'U34', 'Telalu mahal tidak cocok denganstandar', 'rejected', 1, '2026-02-15 13:08:12', '2026-02-15 13:08:12'),
(50, 'P300', 'U34', 'Telalu mahal tidak cocok denganstandar', 'rejected', 1, '2026-02-15 13:08:12', '2026-02-15 13:08:12');

-- --------------------------------------------------------

--
-- Table structure for table `product_rejection_reasons`
--

CREATE TABLE `product_rejection_reasons` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kodeproduk` varchar(15) NOT NULL,
  `reason` text NOT NULL,
  `rejected_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_variant_options`
--

CREATE TABLE `product_variant_options` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `variant_type_id` bigint(20) UNSIGNED NOT NULL,
  `value` varchar(100) NOT NULL,
  `image` text DEFAULT NULL,
  `price_adjustment` decimal(12,2) NOT NULL DEFAULT 0.00,
  `stock` int(11) DEFAULT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variant_options`
--

INSERT INTO `product_variant_options` (`id`, `variant_type_id`, `value`, `image`, `price_adjustment`, `stock`, `display_order`, `created_at`, `updated_at`) VALUES
(3, 3, 'Merah', 'uploads/variants/variant_268_0_0_1771049259.jpg', 0.00, 20, 0, '2026-02-13 23:18:13', '2026-02-13 23:18:13'),
(4, 4, 'Merah Maroon', 'uploads/variants/variant_tenun_189_4.svg', 0.00, 15, 0, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(5, 4, 'Biru Indigo', 'uploads/variants/variant_tenun_189_5.svg', 50000.00, 10, 1, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(6, 4, 'Hitam Klasik', 'uploads/variants/variant_tenun_189_6.svg', 25000.00, 12, 2, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(7, 5, '2 x 1 meter', NULL, 0.00, NULL, 0, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(8, 5, '2.5 x 1.2 meter', NULL, 200000.00, NULL, 1, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(9, 6, 'Motif Tradisional', 'uploads/variants/variant_tenun_190_9.svg', 0.00, 8, 0, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(10, 6, 'Motif Modern', 'uploads/variants/variant_tenun_190_10.svg', 50000.00, 10, 1, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(11, 6, 'Motif Kombinasi', 'uploads/variants/variant_tenun_190_11.svg', 75000.00, 6, 2, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(12, 7, 'Single (150x200cm)', NULL, 0.00, NULL, 0, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(13, 7, 'Double (200x230cm)', NULL, 150000.00, NULL, 1, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(14, 8, 'Coklat Tanah', 'uploads/variants/variant_tenun_191_14.svg', 0.00, 20, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(15, 8, 'Merah Bata', 'uploads/variants/variant_tenun_191_15.svg', 0.00, 15, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(16, 8, 'Biru Dongker', 'uploads/variants/variant_tenun_191_16.svg', 25000.00, 12, 2, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(22, 11, 'Merah', 'uploads/variants/variant_tenun_193_22.svg', 0.00, 18, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(23, 11, 'Kuning Emas', 'uploads/variants/variant_tenun_193_23.svg', 15000.00, 14, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(24, 11, 'Hijau Tosca', 'uploads/variants/variant_tenun_193_24.svg', 10000.00, 16, 2, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(25, 11, 'Ungu', 'uploads/variants/variant_tenun_193_25.svg', 10000.00, 10, 3, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(26, 12, 'Tote Bag', 'uploads/variants/variant_tenun_194_26.svg', 0.00, 10, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(27, 12, 'Sling Bag', 'uploads/variants/variant_tenun_194_27.svg', -25000.00, 15, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(28, 12, 'Clutch', 'uploads/variants/variant_tenun_194_28.svg', -50000.00, 20, 2, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(29, 13, 'Natural', NULL, 0.00, NULL, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(30, 13, 'Hitam', NULL, 0.00, NULL, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(31, 13, 'Coklat', NULL, 15000.00, NULL, 2, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(32, 14, 'Panjang', 'uploads/variants/variant_tenun_195_32.svg', 0.00, 25, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(33, 14, 'Lipat', 'uploads/variants/variant_tenun_195_33.svg', -25000.00, 30, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(34, 14, 'Koin', 'uploads/variants/variant_tenun_195_34.svg', -50000.00, 35, 2, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(35, 15, 'Merah', NULL, 0.00, NULL, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(36, 15, 'Biru', NULL, 0.00, NULL, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(37, 15, 'Hitam', NULL, 10000.00, NULL, 2, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(38, 16, 'Merah Maroon', 'uploads/variants/variant_tenun_196_38.svg', 0.00, 15, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(39, 16, 'Biru Indigo', 'uploads/variants/variant_tenun_196_39.svg', 25000.00, 12, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(40, 16, 'Hitam Klasik', 'uploads/variants/variant_tenun_196_40.svg', 15000.00, 10, 2, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(41, 17, 'Standar', NULL, 0.00, NULL, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(42, 17, 'Besar', NULL, 100000.00, NULL, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(43, 18, 'Merah Maroon', 'uploads/variants/variant_tenun_197_43.svg', 0.00, 15, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(44, 18, 'Biru Indigo', 'uploads/variants/variant_tenun_197_44.svg', 25000.00, 12, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(45, 18, 'Hitam Klasik', 'uploads/variants/variant_tenun_197_45.svg', 15000.00, 10, 2, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(46, 19, 'Standar', NULL, 0.00, NULL, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(47, 19, 'Besar', NULL, 100000.00, NULL, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(48, 20, 'Merah Maroon', 'uploads/variants/variant_tenun_198_48.svg', 0.00, 15, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(49, 20, 'Biru Indigo', 'uploads/variants/variant_tenun_198_49.svg', 25000.00, 12, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(50, 20, 'Hitam Klasik', 'uploads/variants/variant_tenun_198_50.svg', 15000.00, 10, 2, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(51, 21, 'Standar', NULL, 0.00, NULL, 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(52, 21, 'Besar', NULL, 100000.00, NULL, 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(63, 26, 'Motif Biru', 'uploads/variants/variant_192_0_0_1771056107.jpg', 0.00, 12, 0, '2026-02-14 01:04:42', '2026-02-14 01:04:42'),
(64, 26, 'Motif Flores', 'uploads/variants/variant_tenun_192_18.svg', 25000.00, 10, 1, '2026-02-14 01:04:42', '2026-02-14 01:04:42'),
(65, 26, 'Motif Timor', 'uploads/variants/variant_tenun_192_19.svg', 15000.00, 8, 2, '2026-02-14 01:04:42', '2026-02-14 01:04:42'),
(66, 27, '100x100cm', NULL, 0.00, NULL, 0, '2026-02-14 01:04:42', '2026-02-14 01:04:42'),
(67, 27, '150x200cm', NULL, 100000.00, NULL, 1, '2026-02-14 01:04:42', '2026-02-14 01:04:42');

-- --------------------------------------------------------

--
-- Table structure for table `product_variant_types`
--

CREATE TABLE `product_variant_types` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `product_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variant_types`
--

INSERT INTO `product_variant_types` (`id`, `product_id`, `name`, `display_order`, `created_at`, `updated_at`) VALUES
(3, 268, 'Christmas', 0, '2026-02-13 23:18:13', '2026-02-13 23:18:13'),
(4, 189, 'Warna', 0, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(5, 189, 'Ukuran', 1, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(6, 190, 'Motif', 0, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(7, 190, 'Ukuran', 1, '2026-02-14 00:03:45', '2026-02-14 00:03:45'),
(8, 191, 'Warna', 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(11, 193, 'Warna', 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(12, 194, 'Model', 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(13, 194, 'Warna', 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(14, 195, 'Model', 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(15, 195, 'Warna', 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(16, 196, 'Warna', 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(17, 196, 'Ukuran', 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(18, 197, 'Warna', 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(19, 197, 'Ukuran', 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(20, 198, 'Warna', 0, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(21, 198, 'Ukuran', 1, '2026-02-14 00:03:46', '2026-02-14 00:03:46'),
(26, 192, 'Motif', 0, '2026-02-14 01:04:42', '2026-02-14 01:04:42'),
(27, 192, 'Ukuran', 1, '2026-02-14 01:04:42', '2026-02-14 01:04:42');

-- --------------------------------------------------------

--
-- Table structure for table `role_upgrade_requests`
--

CREATE TABLE `role_upgrade_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nama_pemilik` varchar(100) NOT NULL,
  `nama_toko` varchar(100) NOT NULL,
  `alamat_toko` varchar(200) NOT NULL,
  `kategori_id` bigint(20) UNSIGNED NOT NULL,
  `status_pengajuan` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `alasan_pengajuan` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`id`, `setting_key`, `setting_value`, `created_at`, `updated_at`) VALUES
(1, 'site_name', 'Gereja', '2026-02-08 05:14:54', '2026-02-15 13:11:28'),
(2, 'site_logo', 'uploads/site/site_logo_1771186288.png', '2026-02-08 05:14:54', '2026-02-15 13:11:28');

-- --------------------------------------------------------

--
-- Table structure for table `tacara`
--

CREATE TABLE `tacara` (
  `kodeacara` varchar(10) NOT NULL,
  `namaacara` varchar(100) NOT NULL,
  `detail` text DEFAULT NULL,
  `tanggal` date NOT NULL,
  `kuotapeserta` int(11) NOT NULL DEFAULT 0,
  `tanggaldaftar` date NOT NULL,
  `lokasi` varchar(200) DEFAULT NULL,
  `gambar` varchar(255) DEFAULT NULL,
  `gambar_position_x` int(11) DEFAULT 50,
  `gambar_position_y` int(11) DEFAULT 50,
  `gambar_scale` decimal(3,2) DEFAULT 1.00,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tacara`
--

INSERT INTO `tacara` (`kodeacara`, `namaacara`, `detail`, `tanggal`, `kuotapeserta`, `tanggaldaftar`, `lokasi`, `gambar`, `gambar_position_x`, `gambar_position_y`, `gambar_scale`, `status`, `created_at`, `updated_at`) VALUES
('EVT001', 'Festival UMKM Nusantara 2026', 'Festival UMKM terbesar di Indonesia yang menghadirkan lebih dari 200 pelaku UMKM dari seluruh nusantara. Nikmati berbagai produk lokal berkualitas, workshop kewirausahaan, talkshow dengan pengusaha sukses, dan hiburan seni budaya. Tersedia juga area food court dengan kuliner khas daerah. Gratis untuk umum!', '2026-02-15', 500, '2026-01-10', 'Jakarta Convention Center, Hall A-C, Senayan, Jakarta Pusat', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 0, 0, 1.00, 'active', '2026-01-12 19:08:49', '2026-01-14 18:55:17'),
('EVT002', 'Workshop Digital Marketing untuk UMKM', 'Pelatihan intensif selama 2 hari tentang strategi pemasaran digital untuk pelaku UMKM. Materi mencakup: Social Media Marketing, Facebook & Instagram Ads, Google Ads, SEO dasar, Content Creation, dan analisis data. Peserta akan mendapat sertifikat dan konsultasi gratis selama 1 bulan setelah workshop. Instruktur berpengalaman dari praktisi digital marketing.', '2026-02-22', 50, '2026-01-15', 'Hotel Santika Premiere, Ruang Anggrek, Jl. Pandanaran No. 116, Semarang', 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', 0, 0, 1.00, 'active', '2026-01-12 19:08:49', '2026-01-14 18:56:53'),
('EVT003', 'Pameran Batik & Tenun Indonesia', 'Pameran eksklusif yang menampilkan keindahan batik tulis dan tenun dari berbagai daerah Indonesia. Lebih dari 100 pengrajin akan memamerkan karya terbaik mereka. Tersedia demo membatik langsung, workshop pewarnaan alami, dan fashion show batik kontemporer. Pengunjung berkesempatan membeli langsung dari pengrajin dan mendukung pelestarian warisan budaya Indonesia.', '2026-03-01', 300, '2026-02-01', 'Bentara Budaya Yogyakarta, Jl. Suroto No. 2, Kotabaru, Yogyakarta', 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800', 0, 0, 1.00, 'active', '2026-01-12 19:08:49', '2026-01-12 19:08:49'),
('EVT004', 'Seminar Akses Permodalan UMKM', 'Seminar gratis yang membahas berbagai opsi permodalan untuk UMKM: KUR (Kredit Usaha Rakyat), P2P Lending, Venture Capital, dan Angel Investor. Narasumber dari Bank Indonesia, OJK, dan fintech ternama akan berbagi tips pengajuan pinjaman yang berhasil, cara menyusun proposal bisnis, dan manajemen keuangan UMKM. Sesi networking dengan lembaga keuangan juga tersedia.', '2026-03-10', 150, '2026-02-20', 'Aula Bank Indonesia Surabaya, Jl. Pahlawan No. 105, Surabaya', 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=800', 0, 0, 1.00, 'active', '2026-01-12 19:08:49', '2026-01-12 19:08:49'),
('EVT005', 'Bazar Kuliner Tradisional', 'Bazar kuliner yang menghadirkan 75 stan makanan dan minuman tradisional dari berbagai daerah Indonesia. Nikmati rendang Padang, sate Madura, gudeg Jogja, rawon Surabaya, dan masih banyak lagi! Ada juga kompetisi memasak antar UMKM kuliner, demo masak oleh chef ternama, dan pertunjukan musik tradisional. Cocok untuk keluarga dan pecinta kuliner otentik Indonesia.', '2026-03-20', 1000, '2026-02-25', 'Lapangan Parkir Timur Senayan, Jakarta Selatan', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', 0, 0, 1.00, 'active', '2026-01-12 19:08:49', '2026-01-12 19:08:49'),
('EVT006', 'Pelatihan Ekspor untuk UMKM', 'Program pelatihan komprehensif bagi UMKM yang ingin go international. Materi meliputi: prosedur ekspor, dokumen yang diperlukan, standar kualitas internasional, packaging untuk ekspor, marketplace global (Amazon, Alibaba, Etsy), dan regulasi bea cukai. Peserta akan mendapat pendampingan dari Kementerian Perdagangan dan akses ke buyer internasional. Kuota terbatas!', '2026-04-05', 40, '2026-03-01', 'Gedung BPPT, Lt. 3 Ruang Inovasi, Jl. M.H. Thamrin No. 8, Jakarta', 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800', 0, 0, 1.00, 'active', '2026-01-12 19:08:49', '2026-01-12 19:08:49'),
('EVT007', 'Festival Kopi Nusantara', 'Festival tahunan yang merayakan kekayaan kopi Indonesia. Hadir 50+ roaster dan petani kopi dari Aceh hingga Papua. Nikmati cupping session, latte art competition, brewing workshop, dan diskusi tentang sustainable coffee. Pengunjung dapat mencicipi berbagai single origin Indonesia dan membeli langsung dari petani. Live music dan area foto estetik tersedia. Wajib dikunjungi para pecinta kopi!', '2026-01-15', 400, '2026-03-15', 'Gedung Kreatif Bandung, Jl. Laswi No. 7, Bandung', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800', 0, 0, 1.00, 'active', '2026-01-12 19:08:49', '2026-01-14 19:20:06'),
('EVT008', 'Makan bersama', 'makan', '2026-01-20', 10, '2026-01-20', 'Surabaya', 'uploads/events/1768883142_dreamina-2026-01-19-9300-A colorful cartoon-style cheese wedge wi....jpeg', 0, 0, 1.00, 'active', '2026-01-19 21:25:42', '2026-01-19 21:25:42'),
('EVT009', 'Makan bersama', 'makan', '2026-01-20', 10, '2026-01-20', 'Surabaya', 'uploads/events/1768883148_dreamina-2026-01-19-9300-A colorful cartoon-style cheese wedge wi....jpeg', 0, 0, 1.00, 'active', '2026-01-19 21:25:48', '2026-01-19 21:25:48'),
('EVT011', 'Bazar', 'Makan makan', '2026-02-25', 100, '2026-02-09', 'Surababay', 'uploads/events/1770641363_compres.png', 0, 0, 1.00, 'active', '2026-02-09 05:49:23', '2026-02-09 05:49:23'),
('EVT012', 'Hololive event', 'EVENT OTOMATIS', '2026-02-12', 33, '2026-02-12', 'Kenjeran', 'uploads/events/1770905315_ChatGPT Image Jan 27, 2026, 10_51_23 PM (1).png', 0, 0, 1.00, 'active', '2026-02-12 07:08:35', '2026-02-12 07:08:35');

-- --------------------------------------------------------

--
-- Table structure for table `tadmin`
--

CREATE TABLE `tadmin` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `nama` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tadmin`
--

INSERT INTO `tadmin` (`id`, `username`, `password`, `nama`, `email`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2y$08$CpG7p0IgzyIZ9vtGpNXJT.tcS17vx3eLn4opWxPBt/W2Je1RVYv.C', 'Administrator', 'admin@umkm.com', '2026-01-10 01:33:00', '2026-01-10 01:33:00');

-- --------------------------------------------------------

--
-- Table structure for table `tadmin_events`
--

CREATE TABLE `tadmin_events` (
  `kode_event` varchar(20) NOT NULL,
  `nama_event` varchar(150) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `tanggal_mulai` date NOT NULL,
  `tanggal_selesai` date NOT NULL,
  `foto_url` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tproduk`
--

CREATE TABLE `tproduk` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `umkm_id` bigint(20) UNSIGNED DEFAULT NULL,
  `nama_produk` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `harga` decimal(10,2) NOT NULL,
  `kategori` varchar(50) DEFAULT NULL,
  `items` text DEFAULT NULL COMMENT 'JSON array untuk items dalam paket hadiah',
  `stok` int(11) NOT NULL DEFAULT 100,
  `gambar` longtext DEFAULT NULL,
  `status` enum('active','inactive','pending','rejected') DEFAULT 'active',
  `tanggal_mulai` date DEFAULT NULL,
  `tanggal_akhir` date DEFAULT NULL,
  `alasan_penolakan` text DEFAULT NULL,
  `approval_status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tproduk`
--

INSERT INTO `tproduk` (`id`, `umkm_id`, `nama_produk`, `deskripsi`, `harga`, `kategori`, `items`, `stok`, `gambar`, `status`, `tanggal_mulai`, `tanggal_akhir`, `alasan_penolakan`, `approval_status`, `created_at`, `updated_at`) VALUES
(149, 22, 'Batik Tulis Parang', 'Batik tulis motif parang premium', 450000.00, 'kain', NULL, 19, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:45'),
(150, 22, 'Batik Cap Mega Mendung', 'Batik cap motif mega mendung Cirebon', 250000.00, 'kain', NULL, 24, 'https://batiksalma.com/wp-content/uploads/2023/03/BATIK-SALMA-Kain-Batik-Cap-Cetak-Motif-Mega-Mendung-ungu-800x800.jpg', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:45'),
(151, 22, 'Kemeja Batik Pria', 'Kemeja batik lengan panjang pria', 350000.00, 'pakaian', NULL, 67, 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:46'),
(152, 22, 'Dress Batik Wanita', 'Dress batik modern untuk wanita', 400000.00, 'pakaian', NULL, 0, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:46'),
(153, 22, 'Kain Batik Panjang', 'Kain batik 2.5 meter untuk jarik', 300000.00, 'kain', NULL, 55, 'https://pithecanthropusbali.com/cdn/shop/files/U.CKN.JWB.C5.XXXXX.SG.NNKAINPANJANGBATIKJAWASOLO-JOGJA01_800x.jpg?v=1689746160', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:46'),
(154, 22, 'Selendang Batik', 'Selendang batik sutra halus', 150000.00, 'aksesoris', NULL, 95, 'https://img.lazcdn.com/g/ff/kf/Sa273889db722425a95dc7b7d5c7c62cfo.jpg_720x720q80.jpg', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:47'),
(155, 22, 'Tas Batik Etnik', 'Tas tote bag motif batik', 200000.00, 'tas', NULL, 37, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:47'),
(156, 22, 'Dompet Batik', 'Dompet wanita motif batik', 85000.00, 'aksesoris', NULL, 84, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:47'),
(157, 22, 'Masker Batik', 'Masker kain motif batik 3 ply', 35000.00, 'aksesoris', NULL, 14, 'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:47'),
(158, 22, 'Sarung Batik', 'Sarung batik pria premium', 275000.00, 'pakaian', NULL, 19, 'https://www.banggabersarung.com/images/products/2024/2024-01-11/sarung-mangga-gold-kembang-nusantara-batik-hitam-gknb19--image-02', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:49'),
(159, 23, 'Meja Makan Jati 6 Kursi', 'Set meja makan kayu jati solid', 8500000.00, 'furniture', NULL, 7, 'https://images.unsplash.com/photo-1617806118233-18e1de247200?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:50'),
(160, 23, 'Kursi Tamu Ukir', 'Kursi tamu dengan ukiran khas Jepara', 4500000.00, 'furniture', NULL, 30, 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:50'),
(161, 23, 'Lemari Pakaian 3 Pintu', 'Lemari pakaian kayu jati natural', 6500000.00, 'furniture', NULL, 31, 'https://images.unsplash.com/photo-1558997519-83ea9252edf8?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:50'),
(162, 23, 'Tempat Tidur Ukir', 'Dipan tempat tidur ukiran klasik', 7500000.00, 'furniture', NULL, 66, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:50'),
(163, 23, 'Nakas Minimalis', 'Meja samping tempat tidur minimalis', 850000.00, 'furniture', NULL, 33, 'https://images.unsplash.com/photo-1532372576444-dda954194ad0?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:51'),
(164, 23, 'Rak Buku Kayu', 'Rak buku 5 tingkat kayu mahoni', 1500000.00, 'furniture', NULL, 53, 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:53'),
(165, 23, 'Pigura Ukir', 'Bingkai foto ukiran kayu', 350000.00, 'dekorasi', NULL, 88, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQGHZ8vXjqP2M1lEvHN5j8WGxKIL8tA9pazUQ&s', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:53'),
(166, 23, 'Patung Garuda', 'Patung garuda kayu jati finishing natural', 1200000.00, 'dekorasi', NULL, 26, 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:53'),
(167, 23, 'Jam Dinding Kayu', 'Jam dinding dengan frame kayu ukir', 450000.00, 'dekorasi', NULL, 39, 'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:53'),
(168, 23, 'Kotak Perhiasan', 'Kotak perhiasan ukiran halus', 275000.00, 'aksesoris', NULL, 59, 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-12 04:50:54'),
(179, 25, 'Keripik Tempe 250gr', 'Keripik tempe renyah gurih', 35000.00, 'makanan', NULL, 10, 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-14 20:06:15'),
(180, 25, 'Rempeyek Kacang 200gr', 'Rempeyek kacang tanah renyah', 30000.00, 'makanan', NULL, 100, 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-19 21:40:37'),
(181, 25, 'Kue Lapis Legit', 'Lapis legit premium 20x20cm', 185000.00, 'kue', NULL, 95, 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:29:09'),
(182, 25, 'Nastar Keju (500gr)', 'Nastar isi nanas dengan keju', 85000.00, 'kue', NULL, 23, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:26'),
(183, 25, 'Kastengel Premium', 'Kastengel keju gouda 500gr', 95000.00, 'kue', NULL, 68, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:27'),
(184, 25, 'Putri Salju 400gr', 'Kue putri salju lembut', 75000.00, 'kue', NULL, 11, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:27'),
(185, 25, 'Onde-onde Wijen', 'Onde-onde isi kacang hijau (10pcs)', 45000.00, 'makanan', NULL, 50, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:27'),
(186, 25, 'Kue Lumpur 1 Loyang', 'Kue lumpur kentang lembut', 65000.00, 'kue', NULL, 11, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:28'),
(187, 25, 'Brownies Kukus', 'Brownies kukus lembut 20x20cm', 55000.00, 'kue', NULL, 53, 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:28'),
(188, 25, 'Paket Natal Gereja', 'Paket kue natal lengkap: stollen, cookies jahe, dan fruit cake untuk perayaan Natal', 350000.00, 'Paket', '[{\"id\":180,\"nama\":\"Rempeyek Kacang 200gr\",\"harga\":\"30000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1604329760661-e71dc83f8f26?w=400\",\"qty\":1},{\"id\":185,\"nama\":\"Onde-onde Wijen\",\"harga\":\"45000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1558961363-fa8fdf82db35?w=400\",\"qty\":2},{\"id\":179,\"nama\":\"Keripik Tempe 250gr\",\"harga\":\"35000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1604329760661-e71dc83f8f26?w=400\",\"qty\":1},{\"id\":184,\"nama\":\"Putri Salju 400gr\",\"harga\":\"75000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1558961363-fa8fdf82db35?w=400\",\"qty\":1},{\"id\":187,\"nama\":\"Brownies Kukus\",\"harga\":\"55000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1564355808539-22fda35bed7e?w=400\",\"qty\":2}]', 84, 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:28'),
(189, 26, 'Kain Tenun Hinggi', 'Kain tenun ikat motif hinggi', 1500000.00, 'kain', NULL, 90, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:29'),
(190, 26, 'Selimut Tenun', 'Selimut tenun tradisional', 850000.00, 'kain', NULL, 87, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:29'),
(191, 26, 'Sarung Tenun Pria', 'Sarung tenun ikat untuk pria', 650000.00, 'pakaian', NULL, 21, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:30'),
(192, 26, 'Taplak Meja Tenun', 'Taplak meja motif Sumba', 450000.00, 'dekorasi', NULL, 12, 'uploads/products/produk_extra_1771056107_192_1.webp', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-02-14 01:04:42'),
(193, 26, 'Syal Tenun', 'Syal tenun warna natural', 275000.00, 'aksesoris', NULL, 64, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:30'),
(194, 26, 'Tas Tenun Etnik', 'Tas kombinasi tenun dan kulit', 350000.00, 'tas', NULL, 44, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:31'),
(195, 26, 'Dompet Tenun', 'Dompet dengan aksen tenun', 125000.00, 'aksesoris', NULL, 43, 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:31'),
(196, 26, 'Sandal Tenun', 'Sandal dengan tali tenun', 185000.00, 'sepatu', NULL, 32, 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:31'),
(197, 26, 'Ikat Pinggang Tenun', 'Sabuk dengan detail tenun', 175000.00, 'aksesoris', NULL, 35, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:32'),
(198, 26, 'Wall Hanging Tenun', 'Hiasan dinding tenun ikat', 750000.00, 'dekorasi', NULL, 77, 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:32'),
(199, 27, 'Kayu Manis Ceylon 100gr', 'Kayu manis ceylon asli', 45000.00, 'rempah', NULL, 100, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:32'),
(200, 27, 'Cengkeh Zanzibar 100gr', 'Cengkeh premium kualitas ekspor', 65000.00, 'rempah', NULL, 54, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:33'),
(201, 27, 'Pala Banda 100gr', 'Pala Banda aromatik', 55000.00, 'rempah', NULL, 79, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:33'),
(202, 27, 'Lada Hitam Lampung 100gr', 'Lada hitam butiran premium', 35000.00, 'rempah', NULL, 86, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:33'),
(203, 27, 'Kunyit Bubuk 100gr', 'Kunyit bubuk organik', 25000.00, 'rempah', NULL, 22, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:34'),
(204, 27, 'Jahe Merah Bubuk 100gr', 'Jahe merah bubuk berkhasiat', 35000.00, 'rempah', NULL, 47, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:34'),
(205, 27, 'Bumbu Rendang Instan', 'Bumbu rendang siap pakai', 28000.00, 'bumbu', NULL, 100, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:35'),
(206, 27, 'Bumbu Soto Komplit', 'Bumbu soto lengkap', 22000.00, 'bumbu', NULL, 19, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:35'),
(207, 27, 'Paket Rempah Nasi Kebuli', 'Set rempah untuk kebuli', 45000.00, 'bumbu', NULL, 28, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:35'),
(208, 27, 'Gift Box Rempah', 'Paket hadiah 8 jenis rempah', 185000.00, 'paket', '[{\"id\":201,\"nama\":\"Pala Banda 100gr\",\"harga\":\"55000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1596040033229-a9821ebd058d?w=400\",\"qty\":2},{\"id\":207,\"nama\":\"Paket Rempah Nasi Kebuli\",\"harga\":\"45000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1596040033229-a9821ebd058d?w=400\",\"qty\":1},{\"id\":206,\"nama\":\"Bumbu Soto Komplit\",\"harga\":\"22000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1596040033229-a9821ebd058d?w=400\",\"qty\":1},{\"id\":199,\"nama\":\"Kayu Manis Ceylon 100gr\",\"harga\":\"45000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1596040033229-a9821ebd058d?w=400\",\"qty\":2}]', 28, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:36'),
(209, 28, 'Vas Bunga Minimalis', 'Vas keramik desain minimalis', 175000.00, 'dekorasi', NULL, 39, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:36'),
(210, 28, 'Set Mangkok 4pcs', 'Set mangkok keramik glazed', 225000.00, 'peralatan', NULL, 42, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:36'),
(211, 28, 'Piring Hias Dinding', 'Piring dekoratif motif floral', 145000.00, 'dekorasi', NULL, 25, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:37'),
(212, 28, 'Mug Keramik Handmade', 'Mug keramik dengan pegangan unik', 85000.00, 'peralatan', NULL, 14, 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:37'),
(213, 28, 'Teko Set dengan 4 Cangkir', 'Set teko teh keramik', 350000.00, 'peralatan', NULL, 80, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:37'),
(214, 28, 'Pot Tanaman Kecil Set 3', 'Set pot keramik untuk sukulen', 125000.00, 'dekorasi', NULL, 21, 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:38'),
(215, 28, 'Tempat Lilin Aromaterapi', 'Holder lilin keramik berlubang', 95000.00, 'dekorasi', NULL, 45, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:38'),
(216, 28, 'Tempat Sabun Keramik', 'Wadah sabun batang keramik', 65000.00, 'peralatan', NULL, 91, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:39'),
(217, 28, 'Asbak Keramik Artistic', 'Asbak dengan desain artistik', 75000.00, 'aksesoris', NULL, 27, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:39'),
(218, 28, 'Patung Keramik Dekoratif', 'Patung abstrak keramik glazed', 285000.00, 'dekorasi', NULL, 20, 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:39'),
(219, 29, 'Paket Sayur Mingguan', 'Paket 5kg sayur segar mixed', 125000.00, 'sayuran', NULL, 17, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:40'),
(220, 29, 'Bayam Organik 500gr', 'Bayam hijau segar organik', 18000.00, 'sayuran', NULL, 45, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:40'),
(221, 29, 'Wortel Organik 500gr', 'Wortel manis organik', 22000.00, 'sayuran', NULL, 22, 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:40'),
(222, 29, 'Brokoli Organik 500gr', 'Brokoli segar tanpa pestisida', 35000.00, 'sayuran', NULL, 94, 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:41'),
(223, 29, 'Tomat Cherry 250gr', 'Tomat cherry manis segar', 28000.00, 'sayuran', NULL, 86, 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:41'),
(224, 29, 'Selada Romaine', 'Selada romaine per pack', 15000.00, 'sayuran', NULL, 25, 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:42'),
(225, 29, 'Strawberry Premium 250gr', 'Strawberry Lembang manis', 45000.00, 'buah', NULL, 29, 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:42'),
(226, 29, 'Jamur Shiitake 200gr', 'Jamur shiitake segar', 38000.00, 'sayuran', NULL, 81, 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:42'),
(227, 29, 'Herbs Mix (Basil, Mint, Rosemary)', 'Paket herbal segar', 25000.00, 'rempah', NULL, 26, 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:43'),
(228, 29, 'Microgreens Pack', 'Microgreens mixed fresh', 32000.00, 'sayuran', NULL, 93, 'https://images.unsplash.com/photo-1556801712-76c8eb07bbc9?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:43'),
(229, 30, 'Cincin Perak Ukir', 'Cincin perak 925 ukiran Jawa', 275000.00, 'perhiasan', NULL, 28, 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:43'),
(230, 30, 'Gelang Perak Bangle', 'Gelang bangle perak tebal', 450000.00, 'perhiasan', NULL, 26, 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:44'),
(231, 30, 'Kalung Perak Liontin', 'Kalung dengan liontin perak', 385000.00, 'perhiasan', NULL, 60, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:44'),
(232, 30, 'Anting Perak Drop', 'Anting perak model drop', 225000.00, 'perhiasan', NULL, 33, 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:45'),
(233, 30, 'Bros Perak Filigree', 'Bros perak teknik filigree', 195000.00, 'aksesoris', NULL, 48, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:45'),
(234, 30, 'Gantungan Kunci Perak', 'Keychain perak custom', 125000.00, 'aksesoris', NULL, 41, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:45'),
(235, 30, 'Sendok Perak Hias', 'Sendok perak untuk display', 185000.00, 'peralatan', NULL, 48, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:45'),
(236, 30, 'Kotak Perak Antik', 'Kotak perhiasan perak ukir', 550000.00, 'aksesoris', NULL, 81, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:46'),
(237, 30, 'Miniatur Becak Perak', 'Miniatur becak full perak', 750000.00, 'dekorasi', NULL, 66, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:46'),
(238, 30, 'Set Perhiasan Pengantin', 'Set lengkap perhiasan pengantin', 2500000.00, 'perhiasan', NULL, 70, 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:46'),
(239, 31, 'Sambal Matah Bali 200gr', 'Sambal matah segar khas Bali', 45000.00, 'makanan', NULL, 79, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:46'),
(240, 31, 'Sambal Terasi Super', 'Sambal terasi pedas level 5', 38000.00, 'makanan', NULL, 43, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:46'),
(241, 31, 'Sambal Roa Manado', 'Sambal ikan roa asli Manado', 55000.00, 'makanan', NULL, 100, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:46'),
(242, 31, 'Sambal Bajak Jawa', 'Sambal bajak manis pedas', 42000.00, 'makanan', NULL, 20, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:46'),
(243, 31, 'Sambal Dabu-dabu', 'Sambal dabu-dabu Manado', 48000.00, 'makanan', NULL, 92, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:46'),
(244, 31, 'Sambal Ijo Padang', 'Sambal ijo cabe rawit', 45000.00, 'makanan', NULL, 68, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:47'),
(245, 31, 'Sambal Bawang Crispy', 'Sambal dengan bawang goreng', 52000.00, 'makanan', NULL, 98, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:47'),
(246, 31, 'Sambal Mangga Muda', 'Sambal asam manis mangga muda', 48000.00, 'makanan', NULL, 39, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:47'),
(247, 31, 'Paket Sambal 5 Rasa', 'Paket 5 sambal best seller', 175000.00, 'paket', '[{\"id\":244,\"nama\":\"Sambal Ijo Padang\",\"harga\":\"45000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1565299624946-b28f40a0ae38?w=400\",\"qty\":1},{\"id\":245,\"nama\":\"Sambal Bawang Crispy\",\"harga\":\"52000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1565299624946-b28f40a0ae38?w=400\",\"qty\":1},{\"id\":243,\"nama\":\"Sambal Dabu-dabu\",\"harga\":\"48000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1565299624946-b28f40a0ae38?w=400\",\"qty\":2}]', 85, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:47'),
(248, 31, 'Gift Box Sambal Premium', 'Hampers 8 sambal eksklusif', 285000.00, 'paket', '[{\"id\":240,\"nama\":\"Sambal Terasi Super\",\"harga\":\"38000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1565299624946-b28f40a0ae38?w=400\",\"qty\":1},{\"id\":243,\"nama\":\"Sambal Dabu-dabu\",\"harga\":\"48000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1565299624946-b28f40a0ae38?w=400\",\"qty\":2},{\"id\":244,\"nama\":\"Sambal Ijo Padang\",\"harga\":\"45000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1565299624946-b28f40a0ae38?w=400\",\"qty\":2},{\"id\":241,\"nama\":\"Sambal Roa Manado\",\"harga\":\"55000.00\",\"gambar\":\"https:\\/\\/images.unsplash.com\\/photo-1565299624946-b28f40a0ae38?w=400\",\"qty\":1}]', 62, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-12 04:46:41', '2026-01-28 08:30:47'),
(252, 24, 'jembatan', 'd', 18.00, 'accessory', NULL, 2, 'uploads/products/product_24_0_1768446214.png', 'inactive', NULL, NULL, NULL, 'rejected', '2026-01-14 20:03:34', '2026-02-09 05:34:40'),
(268, 34, 'Rumah', 'df', 3000.00, 'Pakaian Anak', NULL, 0, 'uploads/products/product_34_0_1769013924.png', 'active', NULL, NULL, NULL, 'approved', '2026-01-21 09:45:24', '2026-02-13 09:34:05'),
(270, 34, 'Kopi Arabica Premium', 'Biji kopi arabica pilihan dari dataran tinggi', 85000.00, 'minuman', NULL, 39, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:48'),
(271, 34, 'Teh Hijau Organik', 'Teh hijau organik tanpa pestisida', 45000.00, 'minuman', NULL, 92, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:48'),
(272, 34, 'Madu Hutan Asli', 'Madu murni dari hutan tropis', 120000.00, 'makanan', NULL, 28, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:48'),
(273, 34, 'Keripik Singkong Pedas', 'Keripik singkong renyah dengan bumbu pedas', 25000.00, 'makanan', NULL, 200, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:48'),
(274, 34, 'Sambal Matah', 'Sambal matah khas Bali siap saji', 35000.00, 'makanan', NULL, 80, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:49'),
(275, 34, 'Gula Aren Bubuk', 'Gula aren murni dalam bentuk bubuk', 55000.00, 'makanan', NULL, 60, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:49'),
(276, 34, 'Cookies Jahe', 'Kue kering dengan aroma jahe segar', 40000.00, 'makanan', NULL, 118, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:49'),
(277, 34, 'Sirup Markisa', 'Sirup markisa segar tanpa pengawet', 30000.00, 'minuman', NULL, 75, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:49'),
(278, 34, 'Kacang Mete Panggang', 'Kacang mete premium dipanggang sempurna', 95000.00, 'makanan', NULL, 36, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:49'),
(279, 34, 'Teh Herbal Rosella', 'Teh herbal dari bunga rosella segar', 38000.00, 'minuman', NULL, 90, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 'active', NULL, NULL, NULL, 'approved', '2026-01-27 04:35:31', '2026-01-28 08:30:49'),
(280, 34, 'Paket wedding', 'Cocok banget deh untuk pernikahan yuk di beli', 20000.00, 'Paket', NULL, 100, 'uploads/gift-packages/1771001830_weding.jpg', 'active', '2026-02-12', '2026-02-20', NULL, 'approved', '2026-01-28 08:02:22', '2026-02-13 09:57:10'),
(297, 34, 'roti', 'efdfsf', 5000.00, 'Makanan', NULL, 33, 'uploads/products/product_34_1770562713.jpeg', 'active', NULL, NULL, NULL, 'approved', '2026-02-08 07:58:33', '2026-02-08 08:04:36'),
(298, 34, 'eeeeee', 'rrr', 333333.00, 'Makanan', NULL, 3333333, 'uploads/products/product_34_1770565635.jpeg', 'active', NULL, NULL, NULL, 'approved', '2026-02-08 08:47:15', '2026-02-08 08:47:28'),
(299, 34, 'Bokoli', '', 3000.00, 'Makanan', NULL, 500, 'uploads/products/product_34_1770638970.jpeg', 'inactive', NULL, NULL, NULL, 'rejected', '2026-02-09 05:09:30', '2026-02-15 13:08:12'),
(300, 34, 'Teo', '', 3000.00, 'Kain', NULL, 444, 'uploads/products/product_34_1770640700.jpeg', 'inactive', NULL, NULL, NULL, 'rejected', '2026-02-09 05:38:20', '2026-02-15 13:08:12'),
(301, 34, 'Paket makan makan', 'Yuk warframe', 400000.00, 'Paket', NULL, 90, 'uploads/gift-packages/1770907167_UKDC-removebg-preview.png', 'active', '2026-02-12', '2026-02-28', NULL, 'pending', '2026-02-12 07:39:27', '2026-02-12 07:51:50'),
(303, 35, 'Produk Demo 75', 'Produk unggulan dari toko kami dengan kualitas terbaik', 20000.00, 'Panda', NULL, 61, 'uploads/products/product_35_0_1770946685.png', 'active', NULL, NULL, NULL, 'pending', '2026-02-12 18:38:05', '2026-02-14 05:17:32'),
(309, 38, 'Produk Demo 36', 'Produk unggulan dari toko kami dengan kualitas terbaik', 51192.00, 'Furniture', NULL, 66, 'uploads/products/product_38_0_1771069790.png', 'active', NULL, NULL, NULL, 'approved', '2026-02-14 04:49:50', '2026-02-14 05:19:44'),
(310, NULL, 'Paket Natal Spesial', 'Paket berisi:\n- Kue Natal Premium\n- Coklat Import\n- Lilin Natal Aromaterapi\n- Kartu Ucapan Custom\n- Kotak Hadiah Eksklusif', 250000.00, 'Paket', '[{\"nama\":\"Kue Natal Premium\"},{\"nama\":\"Coklat Import\"},{\"nama\":\"Lilin Natal Aromaterapi\"},{\"nama\":\"Kartu Ucapan Custom\"},{\"nama\":\"Kotak Hadiah Eksklusif\"}]', 50, 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400', 'active', '2026-01-01', '2026-12-31', NULL, 'approved', '2026-02-14 06:08:40', '2026-02-14 06:08:40'),
(311, NULL, 'Paket Paskah Berkat', 'Paket berisi:\n- Roti Paskah Homemade\n- Telur Paskah Coklat (6 pcs)\n- Madu Murni 250ml\n- Kartu Paskah', 175000.00, 'Paket', '[{\"nama\":\"Roti Paskah Homemade\"},{\"nama\":\"Telur Paskah Coklat (6 pcs)\"},{\"nama\":\"Madu Murni 250ml\"},{\"nama\":\"Kartu Paskah\"}]', 30, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=400', 'active', '2026-01-01', '2026-12-31', NULL, 'approved', '2026-02-14 06:08:40', '2026-02-14 06:08:40'),
(312, 22, 'Paket Hampers Premium', 'Paket berisi:\n- Kopi Arabica Specialty 200g\n- Cookies Artisan Mix\n- Granola Homemade 250g\n- Teh Herbal Organik\n- Tas Jinjing Eksklusif', 350000.00, 'Paket', '[{\"nama\":\"Kopi Arabica Specialty 200g\"},{\"nama\":\"Cookies Artisan Mix\"},{\"nama\":\"Granola Homemade 250g\"},{\"nama\":\"Teh Herbal Organik\"},{\"nama\":\"Tas Jinjing Eksklusif\"}]', 25, 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400', 'active', '2026-01-01', '2026-12-31', NULL, 'approved', '2026-02-14 06:08:40', '2026-02-14 06:08:40'),
(313, 23, 'Paket Keluarga Sehat', 'Paket berisi:\n- Madu Hutan 500ml\n- Jamu Tradisional Set\n- Teh Herbal Pilihan\n- Snack Sehat Organik', 200000.00, 'Paket', '[{\"nama\":\"Madu Hutan 500ml\"},{\"nama\":\"Jamu Tradisional Set\"},{\"nama\":\"Teh Herbal Pilihan\"},{\"nama\":\"Snack Sehat Organik\"}]', 40, 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400', 'active', '2026-01-01', '2026-12-31', NULL, 'approved', '2026-02-14 06:08:40', '2026-02-14 06:08:40'),
(314, 25, 'Paket Batik Eksklusif', 'Paket berisi:\n- Kain Batik Tulis Premium\n- Masker Batik (3 pcs)\n- Dompet Batik\n- Kotak Kayu Ukir', 450000.00, 'Paket', '[{\"nama\":\"Kain Batik Tulis Premium\"},{\"nama\":\"Masker Batik (3 pcs)\"},{\"nama\":\"Dompet Batik\"},{\"nama\":\"Kotak Kayu Ukir\"}]', 15, 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=400', 'active', '2026-01-01', '2026-12-31', NULL, 'approved', '2026-02-14 06:08:40', '2026-02-14 06:08:40'),
(320, 22, 'Paket Lebaran Berkah', 'Paket berisi:\n- Kue Kering Premium (3 toples)\n- Sirup Marjan\n- Kurma Ajwa 500g\n- Kotak Hampers', 300000.00, 'Paket', '[{\"nama\":\"Kue Kering Premium (3 toples)\"},{\"nama\":\"Sirup Marjan\"},{\"nama\":\"Kurma Ajwa 500g\"},{\"nama\":\"Kotak Hampers\"}]', 20, 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400', 'pending', '2026-03-01', '2026-04-30', NULL, 'pending', '2026-02-14 06:14:02', '2026-02-14 06:14:02'),
(321, 23, 'Paket Snack Box Meeting', 'Paket berisi:\n- Sandwich Mini (4 pcs)\n- Kue Sus Vla\n- Jus Buah Segar\n- Pudding Cup', 85000.00, 'Paket', '[{\"nama\":\"Sandwich Mini (4 pcs)\"},{\"nama\":\"Kue Sus Vla\"},{\"nama\":\"Jus Buah Segar\"},{\"nama\":\"Pudding Cup\"}]', 100, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 'pending', '2026-02-01', '2026-06-30', NULL, 'pending', '2026-02-14 06:14:02', '2026-02-14 06:14:02'),
(322, 22, 'Paket Murah Meriah', 'Paket berisi:\n- Snack Curah 500g\n- Minuman Sachet (10 pcs)', 25000.00, 'Paket', '[{\"nama\":\"Snack Curah 500g\"},{\"nama\":\"Minuman Sachet (10 pcs)\"}]', 200, 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=400', 'rejected', '2026-01-01', '2026-06-30', 'Kualitas produk tidak memenuhi standar.', 'rejected', '2026-02-04 06:14:02', '2026-02-09 06:14:02'),
(323, 25, 'Paket Valentine Romantis', 'Paket berisi:\n- Coklat Praline\n- Bunga Mawar Artifisial\n- Boneka Mini', 150000.00, 'Paket', '[{\"nama\":\"Coklat Praline\"},{\"nama\":\"Bunga Mawar Artifisial\"},{\"nama\":\"Boneka Mini\"}]', 30, 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400', 'rejected', '2026-02-01', '2026-02-14', 'Gambar produk tidak sesuai dengan isi paket.', 'rejected', '2026-01-30 06:14:02', '2026-02-02 06:14:02'),
(324, NULL, 'Paket Tahun Baru 2025', 'Paket berisi:\n- Kalender Custom 2025\n- Kue Kering Spesial\n- Coklat Premium\n- Kartu Ucapan Tahun Baru', 180000.00, 'Paket', '[{\"nama\":\"Kalender Custom 2025\"},{\"nama\":\"Kue Kering Spesial\"},{\"nama\":\"Coklat Premium\"},{\"nama\":\"Kartu Ucapan Tahun Baru\"}]', 0, 'https://images.unsplash.com/photo-1482517967863-00e15c9b44be?w=400', 'active', '2025-12-15', '2026-01-05', NULL, 'approved', '2025-12-14 06:14:02', '2025-12-14 06:14:02'),
(325, 23, 'Paket Imlek Prosperity', 'Paket berisi:\n- Kue Keranjang\n- Jeruk Mandarin (1 kg)\n- Angpao Eksklusif (5 pcs)\n- Teh Oolong Premium', 275000.00, 'Paket', '[{\"nama\":\"Kue Keranjang\"},{\"nama\":\"Jeruk Mandarin (1 kg)\"},{\"nama\":\"Angpao Eksklusif (5 pcs)\"},{\"nama\":\"Teh Oolong Premium\"}]', 0, 'https://images.unsplash.com/photo-1548783300-70b41bc84f56?w=400', 'active', '2026-01-15', '2026-02-05', NULL, 'approved', '2026-01-14 06:14:02', '2026-01-14 06:14:02'),
(326, 39, 'Produk Demo 50', 'Produk unggulan dari toko kami dengan kualitas terbaik', 200000.00, 'Makanan', NULL, 56, 'uploads/products/product_39_0_1771185029.png', 'active', NULL, NULL, NULL, 'approved', '2026-02-15 12:50:29', '2026-02-15 12:59:48'),
(327, 39, 'Byte sncak', 'Makaroni dan sncak lezat', 20000.00, 'Makanan', NULL, 999, 'uploads/products/product_39_1771185706.png', 'active', NULL, NULL, NULL, 'approved', '2026-02-15 13:01:46', '2026-02-15 13:02:25'),
(328, 39, 'Paket Spesial', 'Paket isitimewa', 30000.00, 'Paket', '[{\"nama\":\"Byte sncak\"},{\"nama\":\"Byte Drink\"}]', 100, 'uploads/gift-packages/1771185858_ChatGPT Image Jan 27, 2026, 06_49_54 PM.png', 'active', '2026-02-16', '2026-02-28', NULL, 'approved', '2026-02-15 13:04:18', '2026-02-15 13:04:39');

-- --------------------------------------------------------

--
-- Table structure for table `tumkm`
--

CREATE TABLE `tumkm` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `nama_toko` varchar(255) NOT NULL,
  `nama_pemilik` varchar(100) NOT NULL,
  `deskripsi` text NOT NULL,
  `foto_toko` longtext DEFAULT NULL,
  `kategori_id` bigint(20) UNSIGNED DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `telepon` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `instagram` varchar(100) DEFAULT NULL,
  `about_me` text DEFAULT NULL,
  `paroki` varchar(255) DEFAULT NULL,
  `umat` varchar(255) DEFAULT NULL,
  `dokumen_perjanjian` varchar(255) DEFAULT NULL,
  `nama_bank` varchar(100) DEFAULT NULL,
  `no_rekening` varchar(50) DEFAULT NULL,
  `atas_nama_rekening` varchar(255) DEFAULT NULL,
  `alamat` varchar(200) DEFAULT NULL,
  `kota` varchar(100) DEFAULT NULL,
  `kode_pos` varchar(10) DEFAULT NULL,
  `status` enum('pending','active','inactive','rejected') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `menyediakan_jasa_kirim` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tumkm`
--

INSERT INTO `tumkm` (`id`, `user_id`, `nama_toko`, `nama_pemilik`, `deskripsi`, `foto_toko`, `kategori_id`, `whatsapp`, `telepon`, `email`, `instagram`, `about_me`, `paroki`, `umat`, `dokumen_perjanjian`, `nama_bank`, `no_rekening`, `atas_nama_rekening`, `alamat`, `kota`, `kode_pos`, `status`, `created_at`, `updated_at`, `menyediakan_jasa_kirim`) VALUES
(22, 2, 'Batik Nusantara', 'Siti Rahayu', 'Koleksi batik tulis dan cap asli Solo dengan motif tradisional dan modern', 'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600', 7, '6281231794021', '0271-123001', 'batik.nusantara@email.com', 'batiknusantara', 'Pengrajin batik sejak 1985', NULL, NULL, NULL, NULL, NULL, NULL, 'Jl. Batik No. 15', 'Solo', '57111', 'active', '2026-01-12 04:46:41', '2026-01-18 10:43:13', 0),
(23, 3, 'Kerajinan Kayu Jepara', 'Ahmad Wijaya', 'Furniture dan kerajinan kayu jati asli Jepara berkualitas ekspor', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600', 6, '6285600630252', '0291-123002', 'kayujepara@email.com', 'kayujepara', 'Pengrajin kayu turun temurun', NULL, NULL, NULL, NULL, NULL, NULL, 'Jl. Ukir No. 25', 'Jepara', '59411', 'active', '2026-01-12 04:46:41', '2026-01-21 07:48:07', 0),
(24, 4, 'ddd', 'd', 'dsd', 'uploads/toko/toko_ddd_1768446214.png', 8, '081234567003', '021-123003', 'kopinusantara@email.com', 'kopinusantara', 'Pecinta kopi sejak 2010', NULL, NULL, NULL, NULL, NULL, NULL, 'Jl. Kopi No. 8', 'Bandung', '40115', 'rejected', '2026-01-12 04:46:41', '2026-02-09 05:34:40', 0),
(25, 5, 'Snack Tradisional Bu Endang', 'Endang Supriyati', 'Aneka kue dan snack tradisional Indonesia dengan resep turun temurun', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600', 9, '081234567004', '022-123004', 'snack.buendang@email.com', 'snackbuendang', 'Ibu rumah tangga yang hobi membuat kue', NULL, NULL, NULL, NULL, NULL, NULL, 'Jl. Cemara No. 45', 'Surabaya', '60225', 'active', '2026-01-12 04:46:41', '2026-01-17 05:57:55', 0),
(26, 6, 'Tenun Ikat Sumba', 'Dewi Lestari', 'Kain tenun ikat asli Sumba dengan pewarna alami dan motif tradisional', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600', 3, '085600630252', '085600630245', 'tenunsumba@email.com', 'tenunsumba', 'Penenun tradisional Sumba', NULL, NULL, NULL, 'BCA', '6000897374', 'Steven', 'Desa Prailiu', 'kenjeran', '45355', 'active', '2026-01-12 04:46:41', '2026-02-14 02:20:26', 1),
(27, 7, 'Rempah Nusantara', 'Hasan Basri', 'Aneka rempah-rempah berkualitas dari seluruh Indonesia', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600', 5, '081234567006', '0361-123006', 'rempahnusantara@email.com', 'rempahnusantara', 'Supplier rempah sejak 1990', NULL, NULL, NULL, NULL, NULL, NULL, 'Jl. Rempah No. 12', 'Makassar', '90115', 'active', '2026-01-12 04:46:41', '2026-01-17 05:57:55', 0),
(28, 8, 'Keramik Plered', 'Dedi Mulyadi', 'Keramik dan gerabah handmade dari Plered dengan desain modern dan tradisional', 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600', 7, '081234567007', '0264-123007', 'keramikplered@email.com', 'keramikplered', 'Pengrajin keramik generasi ketiga', NULL, NULL, NULL, NULL, NULL, NULL, 'Jl. Keramik No. 8', 'Purwakarta', '41151', 'active', '2026-01-12 04:46:41', '2026-01-17 05:57:55', 0),
(29, 9, 'Organic Farm Lembang', 'Dewi Lestari', 'Sayur dan buah organik segar langsung dari kebun Lembang', 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600', 6, '081234567008', '022-123008', 'organicfarm@email.com', 'organicfarmlembang', 'Petani organik bersertifikat', NULL, NULL, NULL, NULL, NULL, NULL, 'Jl. Kebun Sayur No. 5', 'Lembang', '40391', 'active', '2026-01-12 04:46:41', '2026-01-17 05:57:55', 0),
(30, 10, 'Silver Craft Kotagede', 'Bambang Sutrisno', 'Perhiasan dan kerajinan perak asli Kotagede Yogyakarta', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600', 8, '081234567009', '0274-123009', 'silverkotagede@email.com', 'silverkotagede', 'Pengrajin perak turun temurun', NULL, NULL, NULL, NULL, NULL, NULL, 'Jl. Perak No. 20', 'Yogyakarta', '55171', 'active', '2026-01-12 04:46:41', '2026-01-17 05:57:55', 0),
(31, 11, 'Sambal Nusantara', 'Rina Wulandari', 'Aneka sambal otentik dari berbagai daerah Indonesia dalam kemasan modern', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600', 9, '081234567010', '031-123010', 'sambalnusantara@email.com', 'sambalnusantara', 'Pecinta kuliner pedas', NULL, NULL, NULL, NULL, NULL, NULL, 'Jl. Pedas No. 7', 'Jakarta', '12430', 'active', '2026-01-12 04:46:41', '2026-01-17 05:57:55', 0),
(34, 20, 'Coffee', 'michael', 'Toko menjual berbagai anek kopi', 'uploads/toko/toko_3_1769013924.jpeg', 7, '6285600630252', NULL, 'micahel@gmail.com', NULL, 'rr3r', NULL, NULL, NULL, 'BCA', '555555', 'Michael', NULL, NULL, NULL, 'active', '2026-01-17 06:22:20', '2026-02-09 05:13:55', 0),
(35, 21, 'Tenun Indah', 'Rizky Pratama', 'Toko UMKM demo yang menjual berbagai produk berkualitas dengan harga terjangkau untuk masyarakat.', 'uploads/toko/toko_Tenun_Indah_1770946685.png', 1, '6283033062778', NULL, 'rizky.pratama@gmail.com', 'rizky_pratama', 'Kami adalah UMKM lokal yang berdedikasi menyediakan produk terbaik. Didirikan dengan semangat kewirausahaan untuk memajukan ekonomi daerah.', 'Santo Yosep', 'Lingkungan St. Antonius', 'uploads/dokumen/perjanjian_rrrrrrrrrr_1770558916.pdf', 'BSI', '7511169932', 'Rizky Pratama', 'Kenjeran', NULL, NULL, 'pending', '2026-02-08 05:44:38', '2026-02-12 18:41:01', 1),
(38, 22, 'Starbuck', 'Dewi Lestari', 'Toko UMKM demo yang menjual berbagai produk berkualitas dengan harga terjangkau untuk masyarakat.', 'uploads/toko/toko_Starbuck_1771069790.png', 6, '6286004442539', NULL, 'dewi.lestari@gmail.com', 'dewi_lestari', 'Kami adalah UMKM lokal yang berdedikasi menyediakan produk terbaik. Didirikan dengan semangat kewirausahaan untuk memajukan ekonomi daerah.', 'Santo Petrus', 'Lingkungan St. Theresia', NULL, 'BSI', '8750415223', 'Dewi Lestari', 'Kenjeran', NULL, NULL, 'active', '2026-02-14 04:49:50', '2026-02-14 05:19:44', 1),
(39, 30, 'Sambal Mbak Sri', 'Budi Santoso', 'Toko UMKM demo yang menjual berbagai produk berkualitas dengan harga terjangkau untuk masyarakat.', 'uploads/toko/toko_Sambal_Mbak_Sri_1771185029.png', 3, '6285841840910', NULL, 'budi.santoso@gmail.com', 'budi_santoso', 'Kami adalah UMKM lokal yang berdedikasi menyediakan produk terbaik. Didirikan dengan semangat kewirausahaan untuk memajukan ekonomi daerah.', 'Santo Petrus', 'Lingkungan St. Maria', NULL, 'BNI', '7668499393', 'Budi Santoso', NULL, NULL, NULL, 'active', '2026-02-15 12:50:29', '2026-02-15 12:59:48', 1);

-- --------------------------------------------------------

--
-- Table structure for table `umkm_rejection_comments`
--

CREATE TABLE `umkm_rejection_comments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `kodepengguna` varchar(20) NOT NULL,
  `comment` text NOT NULL,
  `status` enum('rejected','pending') NOT NULL DEFAULT 'rejected',
  `admin_id` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `umkm_rejection_comments`
--

INSERT INTO `umkm_rejection_comments` (`id`, `kodepengguna`, `comment`, `status`, `admin_id`, `created_at`, `updated_at`) VALUES
(5, '20', 'yy', 'rejected', 1, '2026-01-17 06:22:56', '2026-01-17 06:22:56'),
(6, '20', '4', 'rejected', 1, '2026-01-17 06:31:23', '2026-01-17 06:31:23'),
(7, '21', 'Pengajuan toko ditolak oleh admin', 'rejected', 1, '2026-02-08 06:18:46', '2026-02-08 06:18:46'),
(8, '21', 'Pengajuan toko ditolak oleh admin', 'rejected', 1, '2026-02-08 06:47:01', '2026-02-08 06:47:01'),
(9, '21', 'fdffdfdfdfafdffdf', 'rejected', 1, '2026-02-08 07:32:39', '2026-02-08 07:32:39'),
(10, '21', 'rrrrrrrrrrrrrrrrrrrrr', 'rejected', 1, '2026-02-08 07:46:44', '2026-02-08 07:46:44'),
(11, '4', 'Pengajuan toko ditolak oleh admin', 'rejected', 1, '2026-02-09 05:34:40', '2026-02-09 05:34:40'),
(12, '21', 'sddsdsdsdsdsdsddsdsd', 'rejected', 1, '2026-02-12 18:27:44', '2026-02-12 18:27:44'),
(13, '21', 'nervous anaeh adn', 'rejected', 1, '2026-02-12 18:40:25', '2026-02-12 18:40:25'),
(14, '22', 'Toko sudah ada  yang punya logo jangan sama', 'rejected', 1, '2026-02-14 04:53:03', '2026-02-14 04:53:03');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `nama_lengkap` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `no_telepon` varchar(20) DEFAULT NULL,
  `telepon` varchar(20) DEFAULT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `wa_verified` tinyint(1) DEFAULT 0,
  `wa_verification_code` varchar(10) DEFAULT NULL,
  `wa_verified_at` timestamp NULL DEFAULT NULL,
  `alamat` varchar(255) DEFAULT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `kota` varchar(100) DEFAULT NULL,
  `kode_pos` varchar(10) DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'user',
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `nama_lengkap`, `email`, `no_telepon`, `telepon`, `email_verified_at`, `password`, `status`, `wa_verified`, `wa_verification_code`, `wa_verified_at`, `alamat`, `foto_profil`, `kota`, `kode_pos`, `role`, `remember_token`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, '', 'Administrator', 'admin@gereja.com', '085600630252', NULL, NULL, '$2y$08$zQYgje0qGOftnFidLT4UD.f96FuovMfPiDdw2tQdrwGlxqfQyQh0.', 'active', 0, NULL, NULL, NULL, NULL, NULL, NULL, 'user', NULL, '2026-02-08 04:43:01', '2026-02-08 04:44:45', NULL),
(2, '', 'Siti Rahayu', 'umkm@owner.com', '081234567891', NULL, NULL, '$2y$08$OB7MhuaWfBg0BYX450dqHenn/r.kATNrjBsWavuanXMjqeYYL6gpm', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-10 01:28:52', '2026-01-10 01:28:52', NULL),
(3, '', 'Andi Wijaya', 'andi@customer.com', '081234567801', NULL, NULL, '$2y$08$jvvXPfYz8LwH5IXsgsNS..uSthgdFND.85omrMOEfOSQ3kf2.OCzC', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'customer', NULL, '2026-01-10 01:29:19', '2026-01-10 01:29:19', NULL),
(4, '', 'Siti Nurhaliza', 'siti@customer.com', '081234567802', NULL, NULL, '$2y$08$iTsJToGNlS77IeqJx08AHOygOD6OqDNVFLXr5Jk83u9kEc3Alpth2', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-10 01:29:19', '2026-01-10 02:10:11', NULL),
(5, '', 'Budi Santoso', 'budi@customer.com', '081234567803', NULL, NULL, '$2y$08$WpBuFW8z5tBtWSRsy6JXdeC5Plc0wlxJUCQb44nBPTQy.9SZQEZdq', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-10 01:29:19', '2026-01-10 23:21:00', NULL),
(6, '', 'Dewi Lestari', 'dewi@customer.com', '085600630252', NULL, NULL, '$2y$08$FWlIczy1vT.OAO.IrrPqd.WXMO8RBDc.8iUjKXekV4dIq5rY3Mcb2', 'active', 1, NULL, NULL, NULL, NULL, 'kenjeran', '45355', 'umkm', NULL, '2026-01-10 01:29:19', '2026-02-14 02:20:26', NULL),
(7, '', 'Eko Prasetyo', 'eko@customer.com', '081234567805', NULL, NULL, '$2y$08$5v9NC688VlLuIWxVrBKx/uL3VNQZtxHsTgskEjDPh.r/HwPqafdAi', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'customer', NULL, '2026-01-10 01:29:19', '2026-01-10 01:29:19', NULL),
(8, '', 'Ibu Sari', 'sari@umkm.com', '081234567901', NULL, NULL, '$2y$08$d4fdg9fS0tKPOXnuz9AHyetWAgDEOVYkZPfbnuxnokwqu/89uP/9m', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-10 01:29:19', '2026-01-10 01:29:19', NULL),
(9, '', 'Joko Widodo', 'joko@umkm.com', '081234567902', NULL, NULL, '$2y$08$C/cGEtmNCknTuKHNJF5tE.kPVem43K2nnFe8b1cvMdeGlw4TWSvPG', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-10 01:29:19', '2026-01-10 01:29:19', NULL),
(10, '', 'Siti Nurhaliza', 'ratna@umkm.com', '081234567903', NULL, NULL, '$2y$08$17qwB1d1srerHnV459Xa9OptdMXVSb0pwXTtVpui/P/HXMy/pZSoa', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-10 01:29:19', '2026-01-10 01:29:19', NULL),
(11, '', 'Budi Santoso', 'beni@umkm.com', '081234567904', NULL, NULL, '$2y$08$5Wzm0Y2QrMU0I8XJY.Zey.Oqq4pihfOk/qs1N1KzNym/dCbir6VR6', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-10 01:29:19', '2026-01-10 01:29:19', NULL),
(12, '', 'Rina Wijaya', 'yani@umkm.com', '081234567905', NULL, NULL, '$2y$08$w9iqxb4RC47.4Xeyj7.uzOHZBC.5FlJjT.SmRK3632lkDwgDUBQxe', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-10 01:29:19', '2026-01-10 01:29:19', NULL),
(13, '', 'Ahmad Fauzi', 'R@gmail.com', '6285175447460', NULL, NULL, '$2y$08$p9bJQdZ8e.dcEJeiFOS5sOKBvlhDFzZ78zPPuwflizeTm1bQlZOim', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-10 20:04:14', '2026-01-10 20:10:36', NULL),
(14, '', 'Dewi Lestari', 'dewi@umkm.com', '081234567894', NULL, NULL, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-11 11:53:49', '2026-01-11 11:53:49', NULL),
(16, '', 'Mega Sari', 'rina@umkm.com', '081234567806', NULL, NULL, '$2y$12$LmxZ9YNZ5JZ5Z5Z5Z5Z5ZuKxN5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-11 06:51:29', '2026-01-11 06:51:29', NULL),
(17, '', 'Hendra Gunawan', 'hendra@umkm.com', '081234567897', NULL, NULL, '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-11 11:53:49', '2026-01-11 11:53:49', NULL),
(18, '', 'fg', 'rg@gmail.com', '6285175447490', NULL, NULL, '$2y$08$KfF7CWCwXh65g.SqMUgwAulzRXTLqT/85CtxaSQohwY9ExdagUbpy', 'active', 1, NULL, NULL, 'Jl. Contoh No. 123', NULL, NULL, NULL, 'customer', NULL, '2026-01-12 22:47:53', '2026-01-12 22:49:20', NULL),
(19, '', 'Budi', 'budi@gmail.com', '62851765849', NULL, NULL, '$2y$08$r3LnF5Q0lEPJQPawdS.Bgu3curb9OFsDyaoPHkCCk0PVSemcFjEJS', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'admin', NULL, '2026-01-14 18:21:11', '2026-01-14 18:38:37', NULL),
(20, '', 'michael', 'micahel@gmail.com', '085175447460', NULL, NULL, '$2y$08$BKjCSx9R6we9bRdFFjg8FeUCYsW7hBpOm2lcH6abW5TH8QotjVeqi', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-01-15 06:18:27', '2026-02-14 00:52:02', NULL),
(21, '', 'user6', 'user6@gmail.com', '628626626262', NULL, NULL, '$2y$08$Au9xj8Q.dz1rJT6IcCCoZ.TjjEU6OCxFALX0BhamY9x1/G9ZoDzAm', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-02-08 05:32:03', '2026-02-08 05:32:03', NULL),
(22, '', 'user7', 'user7@gmail.com', '085175447460', NULL, NULL, '$2y$08$EjQBzcC1iQ3EyUsOIvqG9e/Tb0fzITUv3BDFCRqbFY1ljwCDVz9MC', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-02-08 09:15:41', '2026-02-14 03:40:42', NULL),
(23, '', 'hdhhd', 'hghg@gmail.com', '62851763737383', NULL, NULL, '$2y$08$uIw7tJyUr23xhdwJLa2x1uiBhgE0IppBDS/XUPVfq4jFALrnz8yuu', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'customer', NULL, '2026-02-09 04:54:11', '2026-02-09 04:54:11', NULL),
(24, '', 'Budi Santoso', 'budi.santoso@example.com', '081200000001', NULL, NULL, '$2y$08$h29tuYb7PpP/f3MXB94g6O/.jMaJKynKVHZQbNgPG1O6IVBHJG7Ee', 'active', 0, NULL, NULL, 'Jl. Mawar No. 10, Surabaya', NULL, NULL, NULL, 'customer', NULL, '2026-02-14 06:40:18', '2026-02-14 06:40:18', NULL),
(25, '', 'Siti Rahayu', 'siti.rahayu@example.com', '081200000002', NULL, NULL, '$2y$08$CKZeNl4/w1JYt.Gs2ByA3OA8GwaMYjqdo8PMnQ/mimsdT0qxlQ14.', 'active', 0, NULL, NULL, 'Jl. Melati No. 5, Malang', NULL, NULL, NULL, 'customer', NULL, '2026-02-14 06:40:18', '2026-02-14 06:40:18', NULL),
(26, '', 'Agus Prasetyo', 'agus.prasetyo@example.com', '081200000003', NULL, NULL, '$2y$08$zC7azAJRHNNTkX5HDxcTsuQqjRWhx/znZK4vr27QTF/OJsPS5/L8.', 'active', 0, NULL, NULL, 'Jl. Kenanga No. 12, Sidoarjo', NULL, NULL, NULL, 'customer', NULL, '2026-02-14 06:40:18', '2026-02-14 06:40:18', NULL),
(27, '', 'Dewi Lestari', 'dewi.lestari@example.com', '081200000004', NULL, NULL, '$2y$08$b3QGTAV9rMVreMRm2RPXQOpTAH5sQfr2g2crCySSj5SAVchf0qcVa', 'active', 0, NULL, NULL, 'Jl. Dahlia No. 8, Gresik', NULL, NULL, NULL, 'customer', NULL, '2026-02-14 06:40:18', '2026-02-14 06:40:18', NULL),
(28, '', 'Rizal Firmansyah', 'rizal.firmansyah@example.com', '081200000005', NULL, NULL, '$2y$08$yZXUUVa7Ah01MdPv/3aYse20V5wPRM6y9C76IvDD88oHVRUcUb1Ji', 'active', 0, NULL, NULL, 'Jl. Anggrek No. 3, Mojokerto', NULL, NULL, NULL, 'customer', NULL, '2026-02-14 06:40:18', '2026-02-14 06:40:18', NULL),
(29, '', 'Testuser', 'usertest@gmail.com', '628510630252', NULL, NULL, '$2y$08$GoPdJNpxJLWEN8Ko0IlRGuUHuguHBxfHuIeay5n8BmHpwE7YlHaIK', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'customer', NULL, '2026-02-15 11:53:11', '2026-02-15 11:53:11', NULL),
(30, '', 'testumkm', 'testuserumkm@gmail.com', '6285600630252', NULL, NULL, '$2y$08$ft.5o57GYcLn0OCmryDIz.Mnk886vKrjt48hMGqxy68DMeet7GF6q', 'active', 1, NULL, NULL, NULL, NULL, NULL, NULL, 'umkm', NULL, '2026-02-15 12:23:06', '2026-02-15 12:40:46', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `wa_verifications`
--

CREATE TABLE `wa_verifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `code` varchar(6) NOT NULL,
  `type` varchar(20) NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `verified_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cart_items`
--
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_product_id` (`product_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `event_images`
--
ALTER TABLE `event_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `event_images_event_code_index` (`event_code`);

--
-- Indexes for table `event_participants`
--
ALTER TABLE `event_participants`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `event_products`
--
ALTER TABLE `event_products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `event_vendor_registrations`
--
ALTER TABLE `event_vendor_registrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `event_vendor_registrations_event_id_umkm_id_unique` (`event_id`,`umkm_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_unread` (`user_id`,`is_read`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_images_product_id_index` (`product_id`);

--
-- Indexes for table `product_rejection_comments`
--
ALTER TABLE `product_rejection_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_rejection_comments_kodeproduk_index` (`kodeproduk`),
  ADD KEY `product_rejection_comments_kodepengguna_index` (`kodepengguna`);

--
-- Indexes for table `product_rejection_reasons`
--
ALTER TABLE `product_rejection_reasons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_rejection_reasons_kodeproduk_index` (`kodeproduk`);

--
-- Indexes for table `product_variant_options`
--
ALTER TABLE `product_variant_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_variant_options_variant_type_id_index` (`variant_type_id`);

--
-- Indexes for table `product_variant_types`
--
ALTER TABLE `product_variant_types`
  ADD PRIMARY KEY (`id`),
  ADD KEY `product_variant_types_product_id_index` (`product_id`);

--
-- Indexes for table `role_upgrade_requests`
--
ALTER TABLE `role_upgrade_requests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_upgrade_requests_user_id_unique` (`user_id`),
  ADD KEY `role_upgrade_requests_kategori_id_foreign` (`kategori_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`);

--
-- Indexes for table `tacara`
--
ALTER TABLE `tacara`
  ADD PRIMARY KEY (`kodeacara`);

--
-- Indexes for table `tadmin`
--
ALTER TABLE `tadmin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `tadmin_events`
--
ALTER TABLE `tadmin_events`
  ADD PRIMARY KEY (`kode_event`);

--
-- Indexes for table `tproduk`
--
ALTER TABLE `tproduk`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tproduk_umkm_id_foreign` (`umkm_id`);

--
-- Indexes for table `tumkm`
--
ALTER TABLE `tumkm`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tumkm_user_id_unique` (`user_id`),
  ADD KEY `tumkm_kategori_id_foreign` (`kategori_id`);

--
-- Indexes for table `umkm_rejection_comments`
--
ALTER TABLE `umkm_rejection_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `umkm_rejection_comments_kodepengguna_index` (`kodepengguna`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD UNIQUE KEY `users_telepon_unique` (`telepon`);

--
-- Indexes for table `wa_verifications`
--
ALTER TABLE `wa_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `wa_verifications_phone_number_index` (`phone_number`),
  ADD KEY `wa_verifications_expires_at_index` (`expires_at`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart_items`
--
ALTER TABLE `cart_items`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `event_images`
--
ALTER TABLE `event_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_participants`
--
ALTER TABLE `event_participants`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `event_products`
--
ALTER TABLE `event_products`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `event_vendor_registrations`
--
ALTER TABLE `event_vendor_registrations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=63;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `product_rejection_comments`
--
ALTER TABLE `product_rejection_comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT for table `product_rejection_reasons`
--
ALTER TABLE `product_rejection_reasons`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `product_variant_options`
--
ALTER TABLE `product_variant_options`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=68;

--
-- AUTO_INCREMENT for table `product_variant_types`
--
ALTER TABLE `product_variant_types`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT for table `role_upgrade_requests`
--
ALTER TABLE `role_upgrade_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `site_settings`
--
ALTER TABLE `site_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tadmin`
--
ALTER TABLE `tadmin`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tproduk`
--
ALTER TABLE `tproduk`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=329;

--
-- AUTO_INCREMENT for table `tumkm`
--
ALTER TABLE `tumkm`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `umkm_rejection_comments`
--
ALTER TABLE `umkm_rejection_comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `wa_verifications`
--
ALTER TABLE `wa_verifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `product_images_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `tproduk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_variant_options`
--
ALTER TABLE `product_variant_options`
  ADD CONSTRAINT `product_variant_options_variant_type_id_foreign` FOREIGN KEY (`variant_type_id`) REFERENCES `product_variant_types` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_variant_types`
--
ALTER TABLE `product_variant_types`
  ADD CONSTRAINT `product_variant_types_product_id_foreign` FOREIGN KEY (`product_id`) REFERENCES `tproduk` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_upgrade_requests`
--
ALTER TABLE `role_upgrade_requests`
  ADD CONSTRAINT `role_upgrade_requests_kategori_id_foreign` FOREIGN KEY (`kategori_id`) REFERENCES `categories` (`id`),
  ADD CONSTRAINT `role_upgrade_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tproduk`
--
ALTER TABLE `tproduk`
  ADD CONSTRAINT `tproduk_umkm_id_foreign` FOREIGN KEY (`umkm_id`) REFERENCES `tumkm` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tumkm`
--
ALTER TABLE `tumkm`
  ADD CONSTRAINT `tumkm_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
