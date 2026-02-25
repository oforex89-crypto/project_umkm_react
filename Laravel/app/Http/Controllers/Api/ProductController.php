<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Business;
use App\Models\ProductVariantType;
use App\Models\ProductVariantOption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['umkm', 'images', 'variantTypes.options'])->where('status', 'active')->where('approval_status', 'approved')->get();
        
        // Append images array to each product
        $products->each(function ($product) {
            $allImages = [];
            if ($product->gambar) {
                $allImages[] = $product->gambar;
            }
            foreach ($product->images as $img) {
                $allImages[] = $img->image_path;
            }
            $product->all_images = $allImages;
        });
        
        return response()->json([
            'success' => true,
            'data' => $products
        ], 200);
    }

    public function show($id)
    {
        $product = Product::with(['umkm', 'images', 'variantTypes.options'])->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        // Build images array
        $allImages = [];
        if ($product->gambar) {
            $allImages[] = $product->gambar;
        }
        foreach ($product->images as $img) {
            $allImages[] = $img->image_path;
        }
        $product->all_images = $allImages;

        return response()->json([
            'success' => true,
            'data' => $product
        ], 200);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'umkm_id' => 'required|integer|exists:tumkm,id',
                'nama_produk' => 'required|string|max:255',
                'harga' => 'required|numeric|min:0',
                'stok' => 'nullable|integer|min:0',
                'deskripsi' => 'nullable|string',
                'kategori' => 'nullable|string|max:50',
            ]);

            $product = Product::create([
                'umkm_id' => $validated['umkm_id'],
                'nama_produk' => $validated['nama_produk'],
                'harga' => $validated['harga'],
                'stok' => $validated['stok'] ?? 0,
                'deskripsi' => $validated['deskripsi'] ?? '',
                'kategori' => $validated['kategori'] ?? 'product',
                'status' => 'pending',
                'approval_status' => 'pending'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => $product
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Product store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to create product: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Map frontend field names to database field names
            $updateData = [];
            
            if ($request->has('nama_produk')) {
                $updateData['nama_produk'] = $request->input('nama_produk');
            }
            if ($request->has('harga')) {
                $updateData['harga'] = $request->input('harga');
            }
            if ($request->has('stok')) {
                $updateData['stok'] = $request->input('stok');
            }
            if ($request->has('deskripsi')) {
                $updateData['deskripsi'] = $request->input('deskripsi');
            }
            if ($request->has('kategori')) {
                $updateData['kategori'] = $request->input('kategori');
            }

            // Handle main image upload
            if ($request->hasFile('gambar')) {
                $file = $request->file('gambar');
                $filename = 'produk_' . time() . '_' . $id . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/produk'), $filename);
                $updateData['gambar'] = 'uploads/produk/' . $filename;
            }

            if (!empty($updateData)) {
                $product->update($updateData);
            }

            // Handle deleting extra images
            if ($request->has('hapus_gambar')) {
                $imagesToDelete = $request->input('hapus_gambar');
                if (is_array($imagesToDelete)) {
                    foreach ($imagesToDelete as $imagePath) {
                        // Check if this is the main image (gambar column)
                        if ($product->gambar === $imagePath) {
                            // Try to promote first extra image as new main image
                            $nextImage = \DB::table('product_images')
                                ->where('product_id', $id)
                                ->orderBy('sort_order')
                                ->first();
                            
                            if ($nextImage) {
                                $product->update(['gambar' => $nextImage->image_path]);
                                // Remove the promoted image from product_images
                                \DB::table('product_images')->where('id', $nextImage->id)->delete();
                            } else {
                                $product->update(['gambar' => null]);
                            }
                        } else {
                            // Delete from extra images table
                            \DB::table('product_images')
                                ->where('product_id', $id)
                                ->where('image_path', $imagePath)
                                ->delete();
                        }
                    }
                }
            }

            // Handle additional images upload
            if ($request->hasFile('gambar_tambahan')) {
                $files = $request->file('gambar_tambahan');
                $maxSort = \DB::table('product_images')
                    ->where('product_id', $id)
                    ->max('sort_order') ?? 0;

                foreach ($files as $index => $file) {
                    $filename = 'produk_extra_' . time() . '_' . $id . '_' . ($maxSort + $index + 1) . '.' . $file->getClientOriginalExtension();
                    $file->move(public_path('uploads/products'), $filename);
                    
                    \DB::table('product_images')->insert([
                        'product_id' => $id,
                        'image_path' => 'uploads/products/' . $filename,
                        'sort_order' => $maxSort + $index + 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // Build all_images response
            $freshProduct = $product->fresh();
            $extraImages = \DB::table('product_images')
                ->where('product_id', $id)
                ->orderBy('sort_order')
                ->pluck('image_path')
                ->toArray();
            
            $allImages = [];
            if ($freshProduct->gambar) {
                $allImages[] = $freshProduct->gambar;
            }
            $allImages = array_merge($allImages, $extraImages);
            
            $productData = $freshProduct->toArray();
            $productData['all_images'] = $allImages;

            // Handle variants
            if ($request->has('variants')) {
                $variants = is_string($request->variants) ? json_decode($request->variants, true) : $request->variants;
                
                // Delete existing variant options first (via types), then types
                $existingTypeIds = \DB::table('product_variant_types')
                    ->where('product_id', $id)
                    ->pluck('id')
                    ->toArray();
                if (!empty($existingTypeIds)) {
                    \DB::table('product_variant_options')
                        ->whereIn('variant_type_id', $existingTypeIds)
                        ->delete();
                    \DB::table('product_variant_types')
                        ->where('product_id', $id)
                        ->delete();
                }

                // Re-create variants
                if ($variants && is_array($variants)) {
                    $globalOptIdx = 0;
                    foreach ($variants as $typeIndex => $variantType) {
                        $typeId = \DB::table('product_variant_types')->insertGetId([
                            'product_id' => $id,
                            'name' => $variantType['name'],
                            'display_order' => $typeIndex,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        if (isset($variantType['options']) && is_array($variantType['options'])) {
                            foreach ($variantType['options'] as $optIndex => $option) {
                                $optionImagePath = $option['existing_image'] ?? null;
                                if ($request->hasFile("variant_images.$globalOptIdx")) {
                                    $vFile = $request->file("variant_images.$globalOptIdx");
                                    if (!file_exists(public_path('uploads/variants'))) {
                                        mkdir(public_path('uploads/variants'), 0777, true);
                                    }
                                    $vFilename = 'variant_' . $id . '_' . $typeIndex . '_' . $optIndex . '_' . time() . '.' . $vFile->getClientOriginalExtension();
                                    $vFile->move(public_path('uploads/variants'), $vFilename);
                                    $optionImagePath = 'uploads/variants/' . $vFilename;
                                }

                                \DB::table('product_variant_options')->insert([
                                    'variant_type_id' => $typeId,
                                    'value' => $option['value'],
                                    'image' => $optionImagePath,
                                    'price_adjustment' => $option['price_adjustment'] ?? 0,
                                    'stock' => $option['stock'] ?? null,
                                    'display_order' => $optIndex,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                                $globalOptIdx++;
                            }
                        }
                    }
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'data' => $productData
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Product update error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found'
            ], 404);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully'
        ], 200);
    }

    public function getByBusiness($userId)
    {
        $products = Product::where('user_id', $userId)
            ->where('status', 'active')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products
        ], 200);
    }

    // Update product image (admin only)
    public function updateImage(Request $request, $id)
    {
        try {
            // Find product in tproduk table
            $product = \DB::table('tproduk')->where('id', $id)->first();

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            $validated = $request->validate([
                'gambar' => 'required|string|max:5000000'
            ]);

            \DB::table('tproduk')
                ->where('id', $id)
                ->update(['gambar' => $validated['gambar']]);

            return response()->json([
                'success' => true,
                'message' => 'Product image updated successfully',
                'data' => \DB::table('tproduk')->where('id', $id)->first()
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update product image',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Save variant types and options for a product
     */
    private function saveVariants($productId, $variantsJson)
    {
        // Delete existing variants
        $existingTypes = ProductVariantType::where('product_id', $productId)->get();
        foreach ($existingTypes as $type) {
            $type->options()->delete();
            $type->delete();
        }

        // Parse variants JSON
        $variants = is_string($variantsJson) ? json_decode($variantsJson, true) : $variantsJson;
        if (!$variants || !is_array($variants)) return;

        foreach ($variants as $typeIndex => $variantType) {
            $type = ProductVariantType::create([
                'product_id' => $productId,
                'name' => $variantType['name'],
                'display_order' => $typeIndex,
            ]);

            if (isset($variantType['options']) && is_array($variantType['options'])) {
                foreach ($variantType['options'] as $optIndex => $option) {
                    ProductVariantOption::create([
                        'variant_type_id' => $type->id,
                        'value' => $option['value'],
                        'image' => $option['image'] ?? null,
                        'price_adjustment' => $option['price_adjustment'] ?? 0,
                        'stock' => $option['stock'] ?? null,
                        'display_order' => $optIndex,
                    ]);
                }
            }
        }
    }

    /**
     * Reduce product stock when purchased
     */
    public function reduceStock(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'quantity' => 'required|integer|min:1',
                'variant_option_id' => 'nullable|integer'
            ]);

            // If variant_option_id provided, reduce variant stock
            if (!empty($validated['variant_option_id'])) {
                $option = ProductVariantOption::find($validated['variant_option_id']);
                if ($option && $option->stock !== null) {
                    if ($option->stock < $validated['quantity']) {
                        return response()->json([
                            'success' => false,
                            'message' => "Stok varian tidak mencukupi. Stok tersedia: {$option->stock}"
                        ], 400);
                    }
                    $option->decrement('stock', $validated['quantity']);

                    \Log::info("Variant stock reduced", [
                        'product_id' => $id,
                        'variant_option_id' => $validated['variant_option_id'],
                        'quantity_reduced' => $validated['quantity'],
                        'new_stock' => $option->stock - $validated['quantity']
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Variant stock reduced successfully',
                        'data' => [
                            'product_id' => $id,
                            'variant_option_id' => $validated['variant_option_id'],
                            'quantity_reduced' => $validated['quantity'],
                            'new_stock' => $option->stock - $validated['quantity']
                        ]
                    ], 200);
                }
            }

            // Fall back to product-level stock
            $product = DB::table('tproduk')->where('id', $id)->first();
            $table = 'tproduk';

            if (!$product) {
                $product = Product::find($id);
                $table = 'products';
            }

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            $currentStock = $product->stok ?? 0;
            $quantityToReduce = $validated['quantity'];

            if ($currentStock < $quantityToReduce) {
                return response()->json([
                    'success' => false,
                    'message' => "Stok tidak mencukupi. Stok tersedia: {$currentStock}"
                ], 400);
            }

            if ($table === 'tproduk') {
                DB::table('tproduk')
                    ->where('id', $id)
                    ->decrement('stok', $quantityToReduce);
            } else {
                Product::where('id', $id)->decrement('stok', $quantityToReduce);
            }

            \Log::info("Stock reduced", [
                'product_id' => $id,
                'quantity_reduced' => $quantityToReduce,
                'previous_stock' => $currentStock,
                'new_stock' => $currentStock - $quantityToReduce
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Stock reduced successfully',
                'data' => [
                    'product_id' => $id,
                    'quantity_reduced' => $quantityToReduce,
                    'new_stock' => $currentStock - $quantityToReduce
                ]
            ], 200);

        } catch (\Exception $e) {
            \Log::error('reduceStock error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to reduce stock',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get related products from the same UMKM
     * Falls back to random products if no products from same store
     */
    public function getRelated($id)
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Get other products from same UMKM
            $relatedProducts = Product::with('umkm')
                ->where('umkm_id', $product->umkm_id)
                ->where('id', '!=', $id)
                ->where('status', 'active')
                ->where('approval_status', 'approved')
                ->limit(15)
                ->get();

            // If no products from same store, get random products as fallback
            if ($relatedProducts->isEmpty()) {
                $relatedProducts = Product::with('umkm')
                    ->where('id', '!=', $id)
                    ->where('status', 'active')
                    ->where('approval_status', 'approved')
                    ->inRandomOrder()
                    ->limit(15)
                    ->get();
            }

            return response()->json([
                'success' => true,
                'data' => $relatedProducts
            ], 200);

        } catch (\Exception $e) {
            \Log::error('getRelated error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch related products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get similar products with same category
     */
    public function getSimilar($id)
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Get products with same category from different UMKM
            $similarProducts = Product::with('umkm')
                ->where('kategori', $product->kategori)
                ->where('umkm_id', '!=', $product->umkm_id)
                ->where('id', '!=', $id)
                ->where('status', 'active')
                ->where('approval_status', 'approved')
                ->limit(15)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $similarProducts
            ], 200);

        } catch (\Exception $e) {
            \Log::error('getSimilar error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch similar products',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get random products from other stores
     */
    public function getRandomOthers($id)
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found'
                ], 404);
            }

            // Get random products from OTHER stores (not same UMKM)
            $randomProducts = Product::with('umkm')
                ->where('umkm_id', '!=', $product->umkm_id)
                ->where('id', '!=', $id)
                ->where('status', 'active')
                ->where('approval_status', 'approved')
                ->inRandomOrder()
                ->limit(15)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $randomProducts
            ], 200);

        } catch (\Exception $e) {
            \Log::error('getRandomOthers error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch random products',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
