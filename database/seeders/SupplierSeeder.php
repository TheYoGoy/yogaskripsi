<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'code' => 'SUP-001',
                'name' => 'PT. Elektronik Maju',
                'contact_person' => 'Budi Santoso',
                'phone' => '081234567890',
                'email' => 'budi@elektronikmaju.com',
                'address' => 'Jl. Elektronik No. 123, Jakarta',
            ],
            [
                'code' => 'SUP-002',
                'name' => 'CV. Makanan Sehat',
                'contact_person' => 'Agus Salim',
                'phone' => '087134567896',
                'email' => 'agus@makanansehat.com',
                'address' => 'Jl. Kesehatan No. 34, Medan',
            ],
            [
                'code' => 'SUP-003',
                'name' => 'UD. Sandang Jaya',
                'contact_person' => 'Siti Aminah',
                'phone' => '081298765432',
                'email' => 'siti@sandangjaya.com',
                'address' => 'Jl. Tekstil No. 21, Bandung',
            ],
            [
                'code' => 'SUP-004',
                'name' => 'PT. Rumah Indah',
                'contact_person' => 'Rudi Hartono',
                'phone' => '082345678912',
                'email' => 'rudi@rumahindah.com',
                'address' => 'Jl. Perabot No. 11, Surabaya',
            ],
            [
                'code' => 'SUP-005',
                'name' => 'Toko ATK Sukses',
                'contact_person' => 'Linda Wijaya',
                'phone' => '081345678923',
                'email' => 'linda@atksukses.com',
                'address' => 'Jl. Kanto No. 99, Yogyakarta',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::updateOrCreate(
                ['code' => $supplier['code']],
                $supplier
            );
        }
    }
}
