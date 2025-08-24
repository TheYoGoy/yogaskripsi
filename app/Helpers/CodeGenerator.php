<?php

namespace App\Helpers;

use App\Models\Supplier;
use App\Models\AppSetting;

class CodeGenerator
{
    public static function generateSupplierCode()
    {
        $prefix = AppSetting::where('key', 'supplier_code_prefix')->value('value') ?? 'SUP';

        $lastSupplier = Supplier::whereNotNull('code')
            ->where('code', 'like', $prefix . '-%')
            ->orderByDesc('id')
            ->first();

        if ($lastSupplier && preg_match('/\d+$/', $lastSupplier->code, $matches)) {
            $lastNumber = intval($matches[0]);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix . '-' . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
    }
}
