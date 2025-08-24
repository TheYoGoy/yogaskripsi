<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingController extends Controller
{
    public function index()
    {
        $setting = Setting::first();
        $units = Unit::all(['id', 'name']);

        return Inertia::render('Settings/Index', [
            'setting' => $setting,
            'units' => $units,
        ]);
    }

    public function update(Request $request)
    {
        $setting = Setting::first();

        $validated = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'company_logo' => 'nullable|image|max:2048',
            'stock_prefix_in' => 'nullable|string|max:10',
            'stock_prefix_out' => 'nullable|string|max:10',
            'stock_min_threshold' => 'nullable|integer|min:0',
            'default_lead_time' => 'nullable|integer|min:0',
            'default_ordering_cost' => 'nullable|numeric|min:0',
            'default_holding_cost' => 'nullable|numeric|min:0',
            'default_unit_id' => 'nullable|exists:units,id',
            'date_format' => 'nullable|string|max:20',
            'timezone' => 'nullable|string|max:50',
            'dark_mode' => 'nullable|boolean',
            'default_safety_stock' => 'nullable|integer|min:0',
            'default_safety_stock_percentage' => 'nullable|numeric|min:0',
            'rop_formula' => 'nullable|string|max:50',
        ]);

        // Whitelist field yang boleh disimpan
        $allowedKeys = [
            'company_name',
            'stock_prefix_in',
            'stock_prefix_out',
            'stock_min_threshold',
            'default_lead_time',
            'default_ordering_cost',
            'default_holding_cost',
            'default_unit_id',
            'date_format',
            'timezone',
            'dark_mode',
            'default_safety_stock',
            'default_safety_stock_percentage',
            'rop_formula',
        ];

        $data = collect($validated)->only($allowedKeys)->toArray();

        if ($request->hasFile('company_logo')) {
            if ($setting->company_logo && Storage::disk('public')->exists($setting->company_logo)) {
                Storage::disk('public')->delete($setting->company_logo);
            }
            $data['company_logo'] = $request->file('company_logo')->store('logos', 'public');
        }

        $setting->update($data);

        // Update EOQ & ROP semua produk
        \App\Models\Product::all()->each(function ($product) {
            $product->timestamps = false; // Disable timestamps
            $product->rop = $product->calculateRop();
            $product->eoq = $product->calculateEoq();
            $product->save();
        });

        return back()->with('success', 'Pengaturan berhasil diperbarui.');
    }


    public function updateFormat(Request $request)
    {
        $request->validate([
            'timezone' => 'required|timezone',
            'date_format' => 'required|string',
        ]);

        $settings = Setting::first();
        $settings->update($request->only('timezone', 'date_format'));

        return redirect()->back()->with('success', 'Format tanggal dan zona waktu berhasil diperbarui.');
    }
}
