<?php

// database/seeders/CategorySeeder.php
namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Category::create(['name' => 'Electronics', 'description' => 'Electronic devices and gadgets.']);
        Category::create(['name' => 'Food & Beverages', 'description' => 'Edible items and drinks.']);
        Category::create(['name' => 'Apparel', 'description' => 'Clothing and accessories.']);
        Category::create(['name' => 'Home Goods', 'description' => 'Items for household use.']);
        Category::create(['name' => 'Office Supplies', 'description' => 'Supplies for office use.']);
        Category::create(['name' => 'Books', 'description' => 'Educational and entertainment books.']);
        Category::create(['name' => 'Stationery', 'description' => 'Paper and writing materials.']);
        Category::create(['name' => 'Sports Equipment', 'description' => 'Items for sports and exercise.']);
        Category::create(['name' => 'Toys', 'description' => 'Toys and games for children.']);
        Category::create(['name' => 'Health & Beauty', 'description' => 'Health and personal care products.']);
        Category::create(['name' => 'Automotive', 'description' => 'Automotive parts and accessories.']);
        Category::create(['name' => 'Garden Supplies', 'description' => 'Gardening tools and supplies.']);
        Category::create(['name' => 'Pet Supplies', 'description' => 'Items for pet care and maintenance.']);
        Category::create(['name' => 'Furniture', 'description' => 'Home and office furniture.']);
        Category::create(['name' => 'Cleaning Supplies', 'description' => 'Household cleaning products.']);
        Category::create(['name' => 'Construction Materials', 'description' => 'Building and construction materials.']);
        Category::create(['name' => 'Medical Supplies', 'description' => 'Medical equipment and supplies.']);
        Category::create(['name' => 'Kitchenware', 'description' => 'Utensils and appliances for kitchen.']);
        Category::create(['name' => 'Footwear', 'description' => 'Shoes and related accessories.']);
        Category::create(['name' => 'Jewelry', 'description' => 'Ornaments and accessories.']);
        Category::create(['name' => 'Hardware', 'description' => 'Tools and hardware supplies.']);
        Category::create(['name' => 'Musical Instruments', 'description' => 'Instruments and accessories for music.']);
        Category::create(['name' => 'Bags & Luggage', 'description' => 'Bags, suitcases, and travel gear.']);
        Category::create(['name' => 'Art Supplies', 'description' => 'Materials for art and craft.']);
        Category::create(['name' => 'Baby Products', 'description' => 'Items for baby care and safety.']);
    }
}
