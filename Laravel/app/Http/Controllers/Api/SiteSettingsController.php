<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SiteSettingsController extends Controller
{
    /**
     * Get site settings
     */
    public function index()
    {
        try {
            // Create table if not exists
            if (!DB::getSchemaBuilder()->hasTable('site_settings')) {
                DB::statement("
                    CREATE TABLE IF NOT EXISTS site_settings (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        setting_key VARCHAR(255) UNIQUE NOT NULL,
                        setting_value TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                    )
                ");
                
                // Insert default values
                DB::table('site_settings')->insert([
                    ['setting_key' => 'site_name', 'setting_value' => 'Pasar UMKM'],
                    ['setting_key' => 'site_logo', 'setting_value' => ''],
                ]);
            }

            $settings = DB::table('site_settings')->get();
            $data = [];
            foreach ($settings as $setting) {
                $data[$setting->setting_key] = $setting->setting_value;
            }

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch site settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update site settings
     */
    public function update(Request $request)
    {
        try {
            // Update site_name
            if ($request->has('site_name')) {
                DB::table('site_settings')
                    ->updateOrInsert(
                        ['setting_key' => 'site_name'],
                        ['setting_value' => $request->site_name, 'updated_at' => now()]
                    );
            }

            // Handle logo removal
            if ($request->has('remove_logo') && $request->remove_logo == '1') {
                // Delete old logo if exists
                $oldLogo = DB::table('site_settings')
                    ->where('setting_key', 'site_logo')
                    ->value('setting_value');
                
                if ($oldLogo && file_exists(public_path($oldLogo))) {
                    unlink(public_path($oldLogo));
                }

                // Reset logo to empty
                DB::table('site_settings')
                    ->updateOrInsert(
                        ['setting_key' => 'site_logo'],
                        ['setting_value' => '', 'updated_at' => now()]
                    );
            }
            // Handle logo upload
            elseif ($request->hasFile('site_logo')) {
                $file = $request->file('site_logo');
                
                // Validate file
                $request->validate([
                    'site_logo' => 'image|mimes:jpeg,jpg,png,gif,svg|max:2048'
                ]);

                // Delete old logo if exists
                $oldLogo = DB::table('site_settings')
                    ->where('setting_key', 'site_logo')
                    ->value('setting_value');
                
                if ($oldLogo && file_exists(public_path($oldLogo))) {
                    unlink(public_path($oldLogo));
                }

                // Save new logo
                $filename = 'site_logo_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move(public_path('uploads/site'), $filename);
                $logoPath = 'uploads/site/' . $filename;

                DB::table('site_settings')
                    ->updateOrInsert(
                        ['setting_key' => 'site_logo'],
                        ['setting_value' => $logoPath, 'updated_at' => now()]
                    );
            }

            // Fetch updated settings
            $settings = DB::table('site_settings')->get();
            $data = [];
            foreach ($settings as $setting) {
                $data[$setting->setting_key] = $setting->setting_value;
            }

            return response()->json([
                'success' => true,
                'message' => 'Site settings updated successfully',
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update site settings',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
