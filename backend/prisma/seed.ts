import "dotenv/config";
import { PRODUCT_IMAGE_POOLS } from "./seed-images";
import { seedOrders } from "./seed-orders";
import { PrismaClient, Condition, ListingStatus } from "../src/generated/client";
import * as bcrypt from "bcryptjs";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

/* ───── helpers ───── */

function slugify(...parts: string[]): string {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CONDITION_VALUES: Condition[] = [
  "new_with_tags",
  "new_without_tags",
  "very_good",
  "good",
  "satisfactory",
];
/* ───── category tree ───── */

interface CatDef {
  id: string;
  name: string;
  slug: string;
  children?: CatDef[];
}

const CATEGORY_TREE: CatDef[] = [
  {
    id: "women",
    name: "Women",
    slug: "women",
    children: [
      {
        id: "women-clothing",
        name: "Clothing",
        slug: "clothing",
        children: [
          { id: "women-clothing-dresses", name: "Dresses", slug: "dresses" },
          { id: "women-clothing-tops", name: "Tops & T-Shirts", slug: "tops-tshirts" },
          { id: "women-clothing-jeans", name: "Jeans", slug: "jeans" },
          { id: "women-clothing-jackets", name: "Jackets & Coats", slug: "jackets-coats" },
          { id: "women-clothing-skirts", name: "Skirts", slug: "skirts" },
          { id: "women-clothing-trousers", name: "Trousers", slug: "trousers" },
          { id: "women-clothing-activewear", name: "Activewear", slug: "activewear" },
          { id: "women-clothing-jumpers", name: "Jumpers & Sweaters", slug: "jumpers-sweaters" },
          { id: "women-clothing-shorts", name: "Shorts", slug: "shorts" },
        ],
      },
      {
        id: "women-shoes",
        name: "Shoes",
        slug: "shoes",
        children: [
          { id: "women-shoes-sneakers", name: "Sneakers", slug: "sneakers" },
          { id: "women-shoes-heels", name: "Heels", slug: "heels" },
          { id: "women-shoes-boots", name: "Boots", slug: "boots" },
          { id: "women-shoes-flats", name: "Flats", slug: "flats" },
          { id: "women-shoes-sandals", name: "Sandals", slug: "sandals" },
        ],
      },
      {
        id: "women-bags",
        name: "Bags",
        slug: "bags",
        children: [
          { id: "women-bags-handbags", name: "Handbags", slug: "handbags" },
          { id: "women-bags-backpacks", name: "Backpacks", slug: "backpacks" },
          { id: "women-bags-crossbody", name: "Crossbody Bags", slug: "crossbody" },
          { id: "women-bags-totes", name: "Totes", slug: "totes" },
        ],
      },
      {
        id: "women-accessories",
        name: "Accessories",
        slug: "accessories",
        children: [
          { id: "women-acc-jewellery", name: "Jewellery", slug: "jewellery" },
          { id: "women-acc-scarves", name: "Scarves", slug: "scarves" },
          { id: "women-acc-hats", name: "Hats", slug: "hats" },
          { id: "women-acc-belts", name: "Belts", slug: "belts" },
          { id: "women-acc-sunglasses", name: "Sunglasses", slug: "sunglasses" },
        ],
      },
      {
        id: "women-beauty",
        name: "Beauty",
        slug: "beauty",
        children: [
          { id: "women-beauty-skincare", name: "Skincare", slug: "skincare" },
          { id: "women-beauty-makeup", name: "Makeup", slug: "makeup" },
          { id: "women-beauty-fragrance", name: "Fragrance", slug: "fragrance" },
        ],
      },
    ],
  },
  {
    id: "men",
    name: "Men",
    slug: "men",
    children: [
      {
        id: "men-clothing",
        name: "Clothing",
        slug: "clothing",
        children: [
          { id: "men-clothing-tshirts", name: "T-Shirts", slug: "tshirts" },
          { id: "men-clothing-shirts", name: "Shirts", slug: "shirts" },
          { id: "men-clothing-jeans", name: "Jeans", slug: "jeans" },
          { id: "men-clothing-jackets", name: "Jackets & Coats", slug: "jackets-coats" },
          { id: "men-clothing-trousers", name: "Trousers", slug: "trousers" },
          { id: "men-clothing-hoodies", name: "Hoodies & Sweatshirts", slug: "hoodies-sweatshirts" },
        ],
      },
      {
        id: "men-shoes",
        name: "Shoes",
        slug: "shoes",
        children: [
          { id: "men-shoes-sneakers", name: "Sneakers", slug: "sneakers" },
          { id: "men-shoes-boots", name: "Boots", slug: "boots" },
          { id: "men-shoes-loafers", name: "Loafers", slug: "loafers" },
        ],
      },
      {
        id: "men-accessories",
        name: "Accessories",
        slug: "accessories",
        children: [
          { id: "men-acc-watches", name: "Watches", slug: "watches" },
          { id: "men-acc-wallets", name: "Wallets", slug: "wallets" },
          { id: "men-acc-belts", name: "Belts", slug: "belts" },
          { id: "men-acc-hats", name: "Hats", slug: "hats" },
        ],
      },
    ],
  },
  {
    id: "designer",
    name: "Designer",
    slug: "designer",
    children: [
      { id: "designer-bags", name: "Designer Bags", slug: "bags" },
      { id: "designer-shoes", name: "Designer Shoes", slug: "shoes" },
      { id: "designer-clothing", name: "Designer Clothing", slug: "clothing" },
      { id: "designer-accessories", name: "Designer Accessories", slug: "accessories" },
    ],
  },
  {
    id: "kids",
    name: "Kids",
    slug: "kids",
    children: [
      { id: "kids-clothing", name: "Kids Clothing", slug: "clothing" },
      { id: "kids-shoes", name: "Kids Shoes", slug: "shoes" },
      { id: "kids-toys", name: "Toys & Games", slug: "toys-games" },
    ],
  },
  {
    id: "home",
    name: "Home",
    slug: "home",
    children: [
      { id: "home-furniture", name: "Furniture", slug: "furniture" },
      { id: "home-decor", name: "Home Decor", slug: "decor" },
      { id: "home-kitchen", name: "Kitchen", slug: "kitchen" },
      { id: "home-bedding", name: "Bedding", slug: "bedding" },
    ],
  },
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    children: [
      { id: "electronics-phones", name: "Phones", slug: "phones" },
      { id: "electronics-tablets", name: "Tablets", slug: "tablets" },
      { id: "electronics-laptops", name: "Laptops & Computers", slug: "laptops" },
      { id: "electronics-audio", name: "Audio", slug: "audio" },
      { id: "electronics-cameras", name: "Cameras", slug: "cameras" },
      { id: "electronics-gaming", name: "Gaming", slug: "gaming" },
    ],
  },
  {
    id: "hobbies",
    name: "Hobbies & Collectibles",
    slug: "hobbies-collectibles",
    children: [
      { id: "hobbies-collectibles", name: "Collectibles", slug: "collectibles" },
      { id: "hobbies-figurines", name: "Figurines", slug: "figurines" },
      { id: "hobbies-trading-cards", name: "Trading Cards", slug: "trading-cards" },
    ],
  },
  {
    id: "sports",
    name: "Sports",
    slug: "sports",
    children: [
      { id: "sports-fitness", name: "Fitness Equipment", slug: "fitness-equipment" },
      { id: "sports-outdoor", name: "Outdoor Gear", slug: "outdoor-gear" },
      { id: "sports-cycling", name: "Cycling", slug: "cycling" },
    ],
  },
];

/* ───── product definitions per leaf category ───── */

interface ProductTemplate {
  brands: string[];
  models: string[];
  variants: string[];
  priceRange: [number, number];
  material?: string[];
  color?: string[];
  sizeLabel: string;
  sizes: string[];
}

const PRODUCT_DEFS: Record<string, ProductTemplate> = {
  /* Women > Clothing */
  "women-clothing-dresses": {
    brands: ["Zara", "H&M", "Mango", "Reformation", "& Other Stories", "COS", "Free People", "Ganni"],
    models: ["Satin Midi Dress", "Floral Wrap Dress", "Knit Bodycon Dress", "Linen Shift Dress", "Slip Dress", "Shirt Dress", "Maxi Sundress", "Mini A-Line Dress"],
    variants: ["Emerald Green", "Navy Floral", "Black", "Cream", "Blush Pink", "Striped Blue", "Red Poppy", "Beige Linen"],
    priceRange: [18, 160],
    material: ["Cotton", "Satin", "Linen", "Viscose", "Polyester", "Tencel"],
    color: ["Green", "Blue", "Black", "Cream", "Pink", "Red", "Beige", "Yellow"],
    sizeLabel: "UK",
    sizes: ["4", "6", "8", "10", "12", "14", "16"],
  },
  "women-clothing-tops": {
    brands: ["Uniqlo", "COS", "Mango", "Zara", "Free People", "H&M", "Ganni", "Acne Studios"],
    models: ["Linen Blouse", "Cotton T-Shirt", "Silk Camisole", "Turtleneck Sweater", "Crop Top", "Puff Sleeve Top", "Wrap Blouse", "Ribbed Tank"],
    variants: ["White", "Black", "Navy", "Striped", "Pink", "Cream", "Sage Green", "Red"],
    priceRange: [8, 95],
    material: ["Cotton", "Linen", "Silk", "Viscose", "Cashmere", "Modal"],
    color: ["White", "Black", "Navy", "Pink", "Green", "Red", "Cream"],
    sizeLabel: "UK",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  "women-clothing-jeans": {
    brands: ["Levi's", "Mango", "Zara", "H&M", "Reformation", "Frame Denim", "Mother Denim", "AGOLDE"],
    models: ["High-Waist Straight Jeans", "Mom Jeans", "Wide Leg Jeans", "Skinny Jeans", "Bootcut Jeans", "Flared Jeans", "Boyfriend Jeans", "Relaxed Fit Jeans"],
    variants: ["Dark Wash", "Light Wash", "Black", "White", "Blue Stonewash", "Acid Wash"],
    priceRange: [15, 180],
    color: ["Blue", "Black", "White"],
    sizeLabel: "Waist",
    sizes: ["24", "25", "26", "27", "28", "29", "30", "31", "32"],
  },
  "women-clothing-jackets": {
    brands: ["COS", "The North Face", "Zara", "Mango", "Rains", "Patagonia", "Arket", "Stutterheim"],
    models: ["Oversized Wool Coat", "Leather Biker Jacket", "Trench Coat", "Denim Jacket", "Puffer Jacket", "Blazer", "Barbour Wax Jacket", "Utility Jacket"],
    variants: ["Charcoal", "Black", "Beige", "Camel", "Olive Green", "Navy", "Brown"],
    priceRange: [35, 340],
    material: ["Wool", "Cotton", "Polyester", "Leather", "Nylon", "Tweed"],
    color: ["Grey", "Black", "Beige", "Green", "Navy", "Brown"],
    sizeLabel: "UK",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  "women-clothing-skirts": {
    brands: ["Mango", "Zara", "H&M", "COS", "Reformation", "Ganni", "Arket"],
    models: ["Pleated Midi Skirt", "A-Line Mini Skirt", "Pencil Skirt", "Wrap Skirt", "Denim Skirt", "Tulle Skirt", "Leather Mini Skirt", "Satin Maxi Skirt"],
    variants: ["Navy", "Black", "Plaid", "White", "Camel", "Pink", "Olive"],
    priceRange: [12, 90],
    material: ["Cotton", "Polyester", "Leather", "Tulle", "Satin", "Wool"],
    color: ["Navy", "Black", "White", "Pink", "Green"],
    sizeLabel: "UK",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  "women-clothing-activewear": {
    brands: ["Lululemon", "Nike", "Adidas", "Gymshark", "Sweaty Betty", "Alo Yoga", "Under Armour"],
    models: ["Align Leggings", "Sports Bra", "Training Shorts", "Running Tank", "Yoga Leggings", "Zip-Up Jacket", "Performance Tee"],
    variants: ["Black", "Navy", "Heathered Grey", "Dark Olive", "Burgundy", "Sage"],
    priceRange: [15, 130],
    material: ["Nylon", "Polyester", "Elastane", "Cotton Blend"],
    color: ["Black", "Navy", "Grey", "Green", "Burgundy"],
    sizeLabel: "UK",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  "women-clothing-jumpers": {
    brands: ["Uniqlo", "H&M", "COS", "Acne Studios", "& Other Stories", "Mango", "Arket", "John Smedley"],
    models: ["Cashmere Crew Neck", "V-Neck Cardigan", "Zip Hoodie", "Chunky Knit Jumper", "Turtleneck Sweater", "Cable Knit Jumper", "Merino Wool Jumper"],
    variants: ["Navy", "Cream", "Charcoal", "Burgundy", "Sage Green", "Mustard Yellow", "Camel"],
    priceRange: [18, 150],
    material: ["Cashmere", "Merino Wool", "Cotton", "Acrylic", "Lambswool"],
    color: ["Navy", "Cream", "Grey", "Burgundy", "Green", "Yellow"],
    sizeLabel: "UK",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  "women-clothing-shorts": {
    brands: ["Zara", "H&M", "Mango", "Levi's", "Uniqlo", "Patagonia", "Arket"],
    models: ["Linen Shorts", "Denim Cutoffs", "Tailored Shorts", "Running Shorts", "Bermuda Shorts", "Paperbag Waist Shorts"],
    variants: ["Beige", "White", "Light Wash", "Black", "Navy", "Khaki"],
    priceRange: [8, 65],
    material: ["Cotton", "Linen", "Denim", "Polyester"],
    color: ["Beige", "White", "Blue", "Black", "Navy"],
    sizeLabel: "UK",
    sizes: ["XS", "S", "M", "L", "XL"],
  },
  "women-clothing-trousers": {
    brands: ["COS", "Mango", "Zara", "H&M", "Arket", "Theory", "& Other Stories"],
    models: ["Wide Leg Trousers", "Tailored Trousers", "Cargo Pants", "Pleated Trousers", "Linen Trousers", "Paperbag Trousers", "Palazzo Pants"],
    variants: ["Black", "Navy", "Beige", "Grey", "Olive", "White", "Brown"],
    priceRange: [14, 120],
    material: ["Cotton", "Linen", "Polyester", "Wool Blend", "Viscose"],
    color: ["Black", "Navy", "Beige", "Grey", "Green", "White", "Brown"],
    sizeLabel: "UK",
    sizes: ["4", "6", "8", "10", "12", "14", "16", "18"],
  },

  /* Women > Shoes */
  "women-shoes-sneakers": {
    brands: ["Nike", "Adidas", "New Balance", "Veja", "Converse", "Vans", "On Running", "Puma"],
    models: ["Air Force 1", "Stan Smith", "550", "Esplar", "Chuck 70", "Old Skool", "Cloud", "Suede Classic"],
    variants: ["White", "Triple Black", "White/Green", "Beige", "Navy", "Pink", "Cream"],
    priceRange: [30, 180],
    material: ["Leather", "Canvas", "Suede", "Mesh"],
    color: ["White", "Black", "Beige", "Navy", "Pink", "Cream"],
    sizeLabel: "US",
    sizes: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"],
  },
  "women-shoes-heels": {
    brands: ["Zara", "Mango", "H&M", "Sam Edelman", "Jeffrey Campbell", "L.K.Bennett", "Tamara Mellon"],
    models: ["Stiletto Heels", "Block Heel Sandals", "Kitten Heels", "Platform Heels", "Mules", "Slingback Heels", "Court Shoes"],
    variants: ["Black", "Nude", "Red", "Silver", "Gold", "White", "Pink"],
    priceRange: [18, 220],
    material: ["Leather", "Suede", "Faux Leather", "Satin"],
    color: ["Black", "Beige", "Red", "Silver", "Gold", "White", "Pink"],
    sizeLabel: "US",
    sizes: ["5", "6", "7", "7.5", "8", "8.5", "9", "10"],
  },
  "women-shoes-boots": {
    brands: ["Dr. Martens", "Timberland", "Hunter", "Vagabond", "Ugg", "Blundstone", "Miracle", "The North Face"],
    models: ["1460 Smooth Boots", "Chelsea Boots", "Winter Boots", "Over-the-Knee Boots", "Ankle Boots", "Western Boots", "Rain Boots"],
    variants: ["Cherry Red", "Black", "Brown", "Tan", "Chestnut", "Grey", "Olive"],
    priceRange: [28, 280],
    material: ["Leather", "Rubber", "Suede", "Nylon"],
    color: ["Red", "Black", "Brown", "Beige", "Grey", "Green"],
    sizeLabel: "US",
    sizes: ["5", "6", "7", "7.5", "8", "8.5", "9", "10", "11"],
  },
  "women-shoes-flats": {
    brands: ["Toms", "Vans", "Converse", "Birkenstock", "Rothy's", "Clarks", "Loewe"],
    models: ["Ballet Flats", "Espadrilles", "Loafers", "Smoking Slippers", "D'Orsay Flats", "Pointed Flats"],
    variants: ["Black", "Nude", "Red", "Leopard", "Navy", "Gold"],
    priceRange: [10, 120],
    material: ["Leather", "Canvas", "Suede", "Fabric"],
    color: ["Black", "Beige", "Red", "Navy", "Gold"],
    sizeLabel: "US",
    sizes: ["5", "6", "7", "7.5", "8", "8.5", "9", "10"],
  },
  "women-shoes-sandals": {
    brands: ["Birkenstock", "Havaianas", "Teva", "Ancient Greek", "Mango", "Zara", "Staud"],
    models: ["Arizona Sandals", "Flip Flops", "Slide Sandals", "Strappy Heeled Sandals", "Flat Sandals", "Platform Sandals", "Gladiator Sandals"],
    variants: ["Mocha", "Black", "White", "Cream", "Gold", "Brown"],
    priceRange: [8, 90],
    material: ["Leather", "Rubber", "Suede", "Fabric"],
    color: ["Brown", "Black", "White", "Cream", "Gold"],
    sizeLabel: "US",
    sizes: ["5", "6", "7", "7.5", "8", "8.5", "9", "10"],
  },

  /* Women > Bags */
  "women-bags-handbags": {
    brands: ["Mango", "Zara", "Coach", "Furla", "Radley", "JW Pei", "DeMellier"],
    models: ["Tote Bag", "Shoulder Bag", "Bucket Bag", "Satchel", "Hobo Bag", "Top Handle Bag", "Doctor Bag"],
    variants: ["Black", "Tan", "Navy", "Cream", "Brown", "Blush Pink", "Cognac"],
    priceRange: [18, 250],
    material: ["Leather", "Faux Leather", "Canvas", "Suede"],
    color: ["Black", "Brown", "Navy", "Cream", "Pink"],
    sizeLabel: "Size",
    sizes: ["Mini", "Small", "Medium", "Large"],
  },
  "women-bags-crossbody": {
    brands: ["Mango", "Zara", "H&M", "Car Shoe", "Kipling", "Fjallraven", "Radley"],
    models: ["Crossbody Bag", "Belt Bag", "Saddle Bag", "Camera Bag", "Phone Bag", "Flap Bag"],
    variants: ["Tan", "Black", "Khaki", "Navy", "Dusty Pink", "Cream", "Red"],
    priceRange: [10, 85],
    material: ["Faux Leather", "Nylon", "Canvas", "Leather"],
    color: ["Brown", "Black", "Green", "Navy", "Pink", "Cream", "Red"],
    sizeLabel: "Size",
    sizes: ["One Size", "Small", "Medium"],
  },
  "women-bags-backpacks": {
    brands: ["Fjallraven", "Herschel", "Eastpak", "Kipling", "Adidas", "Nike", "Everlane"],
    models: ["Kanken Backpack", "Classic Backpack", "Daypack", "Rucksack", "City Pack", "Mini Backpack"],
    variants: ["Sky Blue", "Black", "Navy", "Khaki", "Forest Green", "Sand", "Lavender"],
    priceRange: [15, 120],
    material: ["Canvas", "Nylon", "Polyester", "Waxed Cotton"],
    color: ["Blue", "Black", "Navy", "Green", "Beige", "Purple"],
    sizeLabel: "Litres",
    sizes: ["15L", "20L", "25L", "30L"],
  },
  "women-bags-totes": {
    brands: ["Longchamp", "Mango", "Zara", "L.L.Bean", "Away", "Baggu", "Madewell"],
    models: ["Le Pliage Tote", "Canvas Tote", "Structured Tote", "Shopper Bag", "Beach Tote", "Work Tote"],
    variants: ["Black", "Navy", "Brown", "Red", "Beige", "Striped"],
    priceRange: [12, 150],
    material: ["Nylon", "Canvas", "Leather", "Straw"],
    color: ["Black", "Navy", "Brown", "Red", "Beige"],
    sizeLabel: "Size",
    sizes: ["Small", "Medium", "Large"],
  },

  /* Women > Accessories */
  "women-acc-jewellery": {
    brands: ["Pandora", "Swarovski", "Missoma", "Astrid & Miyu", "Monica Vinader", "Olivia Burton", "Mejuri"],
    models: ["Necklace", "Hoop Earrings", "Bangle Bracelet", "Stacking Ring", "Charm Bracelet", "Stud Earrings", "Tennis Bracelet"],
    variants: ["Gold", "Silver", "Rose Gold", "Mixed Metals"],
    priceRange: [8, 200],
    material: ["Gold-Plated", "Silver", "Stainless Steel", "Brass", "Gold"],
    color: ["Gold", "Silver", "Rose Gold"],
    sizeLabel: "Length",
    sizes: ["16cm", "18cm", "20cm", "One Size"],
  },
  "women-acc-scarves": {
    brands: ["Acne Studios", "Burberry", "Zara", "H&M", "Uniqlo", "Mango", "Arket"],
    models: ["Wool Scarf", "Silk Square", "Cashmere Wrap", "Cotton Scarf", "Pashmina", "Infinity Scarf", "Bandana"],
    variants: ["Navy", "Burgundy", "Check", "Camel", "Black", "Cream"],
    priceRange: [6, 180],
    material: ["Wool", "Silk", "Cashmere", "Cotton", "Acrylic"],
    color: ["Navy", "Burgundy", "Camel", "Black", "Cream"],
    sizeLabel: "Size",
    sizes: ["One Size"],
  },
  "women-acc-hats": {
    brands: ["Acne Studios", "New Era", "Nike", "Adidas", "Carhartt", "Patagonia", "The North Face"],
    models: ["Face Patch Beanie", "Dad Cap", "Bucket Hat", "Beret", "Baseball Cap", "Sun Hat", "Trapper Hat", "Newsboy Cap"],
    variants: ["Navy", "Black", "Cream", "Olive", "Pink", "Beige", "Red"],
    priceRange: [6, 95],
    material: ["Wool", "Cotton", "Acrylic", "Polyester", "Straw"],
    color: ["Navy", "Black", "Cream", "Green", "Pink", "Beige", "Red"],
    sizeLabel: "Size",
    sizes: ["One Size", "S/M", "L/XL"],
  },
  "women-acc-belts": {
    brands: ["Mango", "Zara", "H&M", "COS", "Arket", "Gucci", "Uniqlo"],
    models: ["Leather Belt", "Chain Belt", "Woven Belt", "Wide Waist Belt", "Elastic Belt", "Ribbon Belt"],
    variants: ["Black", "Brown", "Tan", "Gold", "Silver", "Navy"],
    priceRange: [6, 110],
    material: ["Leather", "Faux Leather", "Metal", "Fabric"],
    color: ["Black", "Brown", "Gold", "Silver", "Navy"],
    sizeLabel: "Waist (cm)",
    sizes: ["65", "70", "75", "80", "85", "90", "95", "100"],
  },
  "women-acc-sunglasses": {
    brands: ["Ray-Ban", "Oakley", "Quay Australia", "Le Specs", "Mango", "Zara", "Celine", "Prada"],
    models: ["Aviator Classic", "Wayfarer", "Clubmaster", "Cat Eye", "Round Metal", "Square Frame", "Oversized Shield"],
    variants: ["Gold/Green", "Black/Black", "Tortoiseshell", "Silver/Blue", "Gold/Brown", "Black/Gradient"],
    priceRange: [10, 160],
    material: ["Metal", "Acetate", "Plastic"],
    color: ["Gold", "Black", "Brown", "Silver"],
    sizeLabel: "mm",
    sizes: ["50", "52", "55", "58", "60", "One Size"],
  },

  /* Women > Beauty */
  "women-beauty-skincare": {
    brands: ["The Ordinary", "CeraVe", "La Roche-Posay", "Drunk Elephant", "Kiehl's", "Charlotte Tilbury", "Estee Lauder"],
    models: ["Moisturiser", "Serum", "Face Wash", "Toner", "Eye Cream", "Face Mask", "Sunscreen", "Cleansing Balm"],
    variants: ["Full Size", "Travel Size", "Limited Edition", "Value Set"],
    priceRange: [6, 65],
    sizeLabel: "ml",
    sizes: ["30ml", "50ml", "100ml", "150ml", "200ml"],
  },
  "women-beauty-makeup": {
    brands: ["Charlotte Tilbury", "Fenty Beauty", "MAC", "NARS", "Rare Beauty", "Huda Beauty", "Anastasia Beverly Hills"],
    models: ["Foundation", "Lipstick", "Eyeshadow Palette", "Mascara", "Concealer", "Highlighter", "Setting Spray", "Blush"],
    variants: ["Various Shades", "Limited Edition", "Full Size", "Mini Size"],
    priceRange: [4, 55],
    sizeLabel: "Size",
    sizes: ["Mini", "Full Size", "Travel"],
  },
  "women-beauty-fragrance": {
    brands: ["Chanel", "Dior", "Jo Malone", "Le Labo", "Byredo", "Maison Margiela", "Diptyque", "Tom Ford"],
    models: ["Eau de Parfum", "Eau de Toilette", "Candle", "Travel Spray", "Perfume Oil", "Gift Set"],
    variants: ["50ml", "100ml", "30ml", "Limited Edition", "Refill"],
    priceRange: [18, 190],
    sizeLabel: "ml",
    sizes: ["30ml", "50ml", "75ml", "100ml", "150ml"],
  },

  /* Men > Clothing */
  "men-clothing-tshirts": {
    brands: ["Uniqlo", "H&M", "Nike", "Adidas", "Carhartt", "Supreme", "Polo Ralph Lauren", "Sunspel"],
    models: ["Supima Cotton T-Shirt", "Graphic Tee", "Polo Shirt", "Heavyweight Tee", "Long Sleeve Tee", "Henley Shirt", "V-Neck Tee", "Loopwheel Tee"],
    variants: ["White", "Black", "Navy", "Grey", "Olive", "Burgundy", "Sage"],
    priceRange: [5, 85],
    material: ["Cotton", "Pima Cotton", "Jersey", "Organic Cotton"],
    color: ["White", "Black", "Navy", "Grey", "Green", "Burgundy"],
    sizeLabel: "UK",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
  },
  "men-clothing-shirts": {
    brands: ["COS", "Uniqlo", "H&M", "Mango Man", "Charles Tyrwhitt", "Polo Ralph Lauren", "Arket", "Levi's"],
    models: ["Oxford Shirt", "Linen Shirt", "Denim Shirt", "Flannel Shirt", "Dress Shirt", "Grandad Collar Shirt", "Slim Fit Shirt"],
    variants: ["White", "Light Blue", "Navy", "Blue Check", "Black", "Pink", "Red Tartan"],
    priceRange: [8, 110],
    material: ["Cotton", "Linen", "Denim", "Flannel", "Oxford Cloth"],
    color: ["White", "Blue", "Navy", "Black", "Pink", "Red"],
    sizeLabel: "UK",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },
  "men-clothing-jeans": {
    brands: ["Levi's", "Uniqlo", "Nudie Jeans", "Carhartt", "H&M", "Polo Ralph Lauren", "G-Star RAW", "Dickies"],
    models: ["501 Original Fit", "512 Slim Taper", "511 Slim Fit", "Wide Leg Jeans", "Regular Fit Jeans", "Relaxed Straight Jeans", "Selvedge Jeans"],
    variants: ["Dark Rinse", "Light Wash", "Black", "Stonewash", "Raw Denim", "Grey"],
    priceRange: [14, 200],
    color: ["Blue", "Black", "Grey"],
    sizeLabel: "Waist x Length",
    sizes: ["28x30", "28x32", "29x30", "29x32", "30x30", "30x32", "30x34", "31x32", "32x30", "32x32", "32x34", "33x32", "34x30", "34x32", "36x32"],
  },
  "men-clothing-jackets": {
    brands: ["Levi's", "Carhartt", "Patagonia", "The North Face", "Barbour", "H&M", "Uniqlo", "Arcteryx"],
    models: ["Trucker Jacket", "Work Jacket", "Nuptse Down Jacket", "Bomber Jacket", "Rain Jacket", "Harrington Jacket", "Peacoat", "Field Jacket"],
    variants: ["Blue Denim", "Black", "Khaki", "Navy", "Olive", "Brown", "Red"],
    priceRange: [20, 380],
    material: ["Denim", "Canvas", "Nylon", "Cotton", "Waxed Cotton", "Down"],
    color: ["Blue", "Black", "Green", "Navy", "Brown", "Red"],
    sizeLabel: "UK",
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
  },
  "men-clothing-trousers": {
    brands: ["Uniqlo", "H&M", "COS", "Mango Man", "Carhartt", "Dickies", "Polo Ralph Lauren", "Arket"],
    models: ["Chino Pants", "Cargo Pants", "Tailored Trousers", "Joggers", "Linen Trousers", "Corduroy Pants", "Track Pants", "Work Pants"],
    variants: ["Khaki", "Navy", "Black", "Grey", "Olive", "Beige", "Brown"],
    priceRange: [10, 100],
    material: ["Cotton", "Polyester", "Linen", "Corduroy", "Wool Blend"],
    color: ["Beige", "Navy", "Black", "Grey", "Green", "Brown"],
    sizeLabel: "Waist",
    sizes: ["28", "29", "30", "31", "32", "33", "34", "36", "38", "40"],
  },
  "men-clothing-hoodies": {
    brands: ["Nike", "Adidas", "Carhartt", "Patagonia", "Uniqlo", "H&M", "Supreme", "Fear of God"],
    models: ["Club Hoodie", "Full Zip Hoodie", "Essential Fleece", "Pullover Hoodie", "Quarter Zip Sweatshirt", "Crewneck Sweatshirt", "Retro Hoodie"],
    variants: ["Black", "Navy", "Grey", "Olive", "Burgundy", "Cream", "Forest Green"],
    priceRange: [12, 130],
    material: ["Cotton", "Fleece", "French Terry", "Polyester Blend"],
    color: ["Black", "Navy", "Grey", "Green", "Burgundy", "Cream"],
    sizeLabel: "UK",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
  },

  /* Men > Shoes */
  "men-shoes-sneakers": {
    brands: ["Nike", "Adidas", "New Balance", "Converse", "Vans", "ASICS", "On Running", "Hoka"],
    models: ["Air Max 90", "Samba OG", "550", "Chuck Taylor", "Old Skool", "Gel-Kayano 14", "Cloudmonster", "Speedgoat 5"],
    variants: ["Triple White", "Black/White", "Navy", "Grey/Green", "Beige", "All Black", "Cream"],
    priceRange: [30, 200],
    material: ["Leather", "Suede", "Mesh", "Canvas"],
    color: ["White", "Black", "Navy", "Grey", "Beige", "Cream", "Green"],
    sizeLabel: "US",
    sizes: ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12", "13"],
  },
  "men-shoes-boots": {
    brands: ["Dr. Martens", "Timberland", "Red Wing", "Blundstone", "Loake", "Clarks", "RM Williams", "Solovair"],
    models: ["1460 Smooth Boots", "6-Inch Premium Boots", "Iron Ranger", "Chelsea Boots", "Desert Boots", "Combat Boots", "Chukka Boots", "Work Boots"],
    variants: ["Black", "Brown", "Tan", "Cherry Red", "Dark Brown", "Chestnut", "Wheat"],
    priceRange: [30, 350],
    material: ["Leather", "Suede", "Nubuck"],
    color: ["Black", "Brown", "Beige", "Red", "Tan"],
    sizeLabel: "US",
    sizes: ["7", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12", "13"],
  },
  "men-shoes-loafers": {
    brands: ["Clarks", "Loake", "Grenson", "Church's", "Barker", "Tod's", "H&M", "COS"],
    models: ["Leather Loafers", "Suede Loafers", "Penny Loafers", "Tassel Loafers", "Driving Shoes", "Bit Loafers", "Horsebit Loafers"],
    variants: ["Black", "Brown", "Tan", "Navy", "Burgundy", "Suede Brown"],
    priceRange: [18, 320],
    material: ["Leather", "Suede", "Calfskin"],
    color: ["Black", "Brown", "Beige", "Navy", "Burgundy"],
    sizeLabel: "US",
    sizes: ["7", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12"],
  },

  /* Men > Accessories */
  "men-acc-watches": {
    brands: ["Rolex", "Omega", "Tag Heuer", "Seiko", "Casio", "Timex", "Tissot", "Hamilton"],
    models: ["Datejust 36mm", "Speedmaster Professional", "Carrera", "SKX007 Diver", "G-Shock DW5600", "Weekender", "Le Locle", "Khaki Field"],
    variants: ["Blue Dial", "Black Dial", "Silver Dial", "Green Dial", "Stainless Steel", "Leather Strap", "NATO Strap"],
    priceRange: [45, 8500],
    material: ["Stainless Steel", "Titanium", "Gold", "Ceramic"],
    color: ["Blue", "Black", "Silver", "Green", "Grey"],
    sizeLabel: "mm",
    sizes: ["36mm", "38mm", "40mm", "42mm", "44mm", "46mm"],
  },
  "men-acc-wallets": {
    brands: ["Gucci", "Louis Vuitton", "Hugo Boss", "Bellroy", "Tumi", "Mango Man", "Secrid", "Montblanc"],
    models: ["Bi-Fold Wallet", "Card Holder", "Money Clip", "Travel Wallet", "Passport Wallet", "Coin Purse", "Zip Around Wallet"],
    variants: ["Black", "Brown", "Navy", "Tan", "Dark Green", "Grey"],
    priceRange: [10, 240],
    material: ["Leather", "Canvas", "Aluminum", "Saffiano Leather"],
    color: ["Black", "Brown", "Navy", "Green", "Grey"],
    sizeLabel: "Type",
    sizes: ["Standard", "Slim", "Compact"],
  },
  "men-acc-belts": {
    brands: ["Gucci", "Hugo Boss", "Levi's", "Uniqlo", "H&M", "Mango Man", "Ermenegildo Zegna", "Polo Ralph Lauren"],
    models: ["Dress Belt", "Casual Belt", "Canvas Belt", "Ratcheting Belt", "Braided Belt", "Reversible Belt"],
    variants: ["Black", "Brown", "Tan", "Navy", "Dark Brown"],
    priceRange: [8, 140],
    material: ["Leather", "Canvas", "Fabric"],
    color: ["Black", "Brown", "Navy"],
    sizeLabel: "Waist (cm)",
    sizes: ["75", "80", "85", "90", "95", "100", "105", "110"],
  },
  "men-acc-hats": {
    brands: ["New Era", "Nike", "Adidas", "Carhartt", "The North Face", "Patagonia", "H&M", "Polo Ralph Lauren"],
    models: ["59FIFTY Cap", "Dad Hat", "Trucker Cap", "Beanie", "Bucket Hat", "Flat Brim Cap", "Snapback", "Cuffed Beanie"],
    variants: ["Black", "Navy", "Olive", "Grey", "Red", "White", "Beige"],
    priceRange: [6, 60],
    material: ["Cotton", "Wool", "Acrylic", "Polyester"],
    color: ["Black", "Navy", "Green", "Grey", "Red", "White", "Beige"],
    sizeLabel: "Size",
    sizes: ["One Size", "S/M", "L/XL", "Adjustable"],
  },

  /* Designer */
  "designer-bags": {
    brands: ["Louis Vuitton", "Gucci", "Chanel", "Prada", "Saint Laurent", "Bottega Veneta", "Dior", "Celine"],
    models: ["Neverfull MM", "GG Marmont Bag", "Classic Flap Bag", "Galleria Bag", "Sac de Jour", "Cassette Bag", "Lady Dior", "Belt Bag"],
    variants: ["Monogram", "Black", "Tan", "Beige", "Navy", "Brown", "Camel"],
    priceRange: [380, 4200],
    material: ["Canvas", "Leather", "Lambskin", "Saffiano Leather"],
    color: ["Brown", "Black", "Beige", "Navy", "Camel"],
    sizeLabel: "Size",
    sizes: ["Small", "Medium", "Large", "Mini", "MM", "GM"],
  },
  "designer-shoes": {
    brands: ["Gucci", "Prada", "Saint Laurent", "Christian Louboutin", "Manolo Blahnik", "Jimmy Choo", "Balenciaga", "Alexander McQueen"],
    models: ["Ace Sneakers", "Monolith Boots", "So Kate Heels", "Hangisi Heels", "Triple S Sneakers", "Oversized Sneakers", "Slide Sandals"],
    variants: ["White/Green", "Black", "Red Sole", "Nude", "Silver", "Beige"],
    priceRange: [80, 950],
    material: ["Leather", "Suede", "Canvas", "Satin"],
    color: ["White", "Black", "Red", "Beige", "Silver"],
    sizeLabel: "EU",
    sizes: ["35", "36", "37", "38", "39", "40", "41", "42"],
  },
  "designer-clothing": {
    brands: ["Gucci", "Prada", "Saint Laurent", "Balenciaga", "Off-White", "Kenzo", "Maison Margiela", "Diesel"],
    models: ["Logo T-Shirt", "Silk Shirt", "Designer Jeans", "Wool Coat", "Leather Jacket", "Knitted Sweater", "Track Pants", "Printed Hoodie"],
    variants: ["Black", "White", "Navy", "Cream", "Red", "Green Camo"],
    priceRange: [60, 2800],
    material: ["Cotton", "Silk", "Leather", "Cashmere", "Denim", "Wool"],
    color: ["Black", "White", "Navy", "Cream", "Red", "Green"],
    sizeLabel: "IT",
    sizes: ["40", "42", "44", "46", "48", "50", "52", "54"],
  },
  "designer-accessories": {
    brands: ["Gucci", "Louis Vuitton", "Prada", "Saint Laurent", "Cartier", "Tiffany & Co.", "Hermès", "Dior"],
    models: ["Silk Scarf", "Leather Belt", "Gold Necklace", "Logo Sunglasses", "Leather Gloves", "Key Holder", "Wristlet", "Twilly"],
    variants: ["Black", "Brown", "Navy", "Cream", "Gold", "Silver", "Multicolor"],
    priceRange: [55, 650],
    material: ["Silk", "Leather", "Gold", "Silver", "Acetate"],
    color: ["Black", "Brown", "Navy", "Cream", "Gold", "Silver"],
    sizeLabel: "Size",
    sizes: ["One Size", "Small", "Medium", "Standard"],
  },

  /* Kids */
  "kids-clothing": {
    brands: ["Zara Kids", "H&M Kids", "Uniqlo Kids", "Next", "Mango Kids", "The Children's Place", "Carter's"],
    models: ["Printed T-Shirt", "Denim Jeans", "Puffer Jacket", "Cotton Dress", "Jogger Set", "Raincoat", "School Shirt"],
    variants: ["Blue", "Pink", "Green", "Navy", "Red", "Yellow", "Multicolor"],
    priceRange: [5, 45],
    material: ["Cotton", "Polyester", "Denim", "Fleece"],
    color: ["Blue", "Pink", "Green", "Navy", "Red", "Yellow"],
    sizeLabel: "Age",
    sizes: ["0-3m", "3-6m", "6-12m", "12-18m", "18-24m", "2-3y", "3-4y", "4-5y", "5-6y", "6-7y", "7-8y", "8-9y", "9-10y"],
  },
  "kids-shoes": {
    brands: ["Nike Kids", "Adidas Kids", "Vans Kids", "Clarks Kids", "Geox", "Start-Rite", "Crocs"],
    models: ["Running Shoes", "School Shoes", "Sneakers", "Rain Boots", "Sandals", "Winter Boots", "First Walkers"],
    variants: ["Black", "Navy", "Pink", "Blue", "Red", "White"],
    priceRange: [8, 65],
    material: ["Leather", "Rubber", "Canvas", "Synthetic"],
    color: ["Black", "Navy", "Pink", "Blue", "Red", "White"],
    sizeLabel: "UK",
    sizes: ["3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "1", "2"],
  },
  "kids-toys": {
    brands: ["LEGO", "Hasbro", "Mattel", "Fisher-Price", "VTech", "Melissa & Doug", "Playmobil"],
    models: ["Building Set", "Action Figure", "Board Game", "Puzzle", "Plush Toy", "Learning Tablet", "Doll", "Car Set"],
    variants: ["Standard", "Deluxe", "Travel Size", "Set" ],
    priceRange: [4, 85],
    sizeLabel: "Pieces",
    sizes: ["Small", "Medium", "Large", "20pc", "50pc", "100pc", "200pc"],
  },

  /* Home */
  "home-furniture": {
    brands: ["IKEA", "MUJI", "Herman Miller", "HAY", "Muuto", "West Elm", "H&M Home", "Artek"],
    models: ["KALLAX Shelf Unit", "POANG Armchair", "Aeron Chair", "Floor Lamp", "Coffee Table", "Dining Chair", "Bookshelf", "Desk"],
    variants: ["White", "Black", "Birch Veneer", "Oak", "Walnut", "Grey", "Beige"],
    priceRange: [18, 750],
    material: ["Wood", "Metal", "Mesh", "Particleboard", "Birch"],
    color: ["White", "Black", "Brown", "Grey", "Beige"],
    sizeLabel: "Size",
    sizes: ["Small", "Medium", "Large", "2x2", "4x2", "5x5"],
  },
  "home-decor": {
    brands: ["Zara Home", "H&M Home", "MUJI", "IKEA", "Oliver Bonas", "Anthropologie", "Cult Furniture"],
    models: ["Scented Candle", "Vase", "Throw Pillow", "Wall Art", "Mirror", "Photo Frame", "Plant Pot", "Table Runner"],
    variants: ["White", "Cream", "Terracotta", "Navy", "Sage", "Pink", "Gold"],
    priceRange: [5, 65],
    material: ["Ceramic", "Cotton", "Glass", "Wood", "Wax"],
    color: ["White", "Cream", "Orange", "Navy", "Green", "Pink", "Gold"],
    sizeLabel: "Size",
    sizes: ["Small", "Medium", "Large", "Set of 2", "Set of 3"],
  },
  "home-kitchen": {
    brands: ["Le Creuset", "Lodge", "Smeg", "Vitamix", "KitchenAid", "Zwilling", "Duralex", "Joseph Joseph"],
    models: ["Cast Iron Skillet", "French Press", "Stand Mixer", "Chef's Knife", "Blender", "Glass Bowl Set", "Baking Dish", "Measuring Cups"],
    variants: ["Black", "White", "Cyan", "Red", "Sea Salt", "Meringue", "Stainless Steel"],
    priceRange: [6, 280],
    material: ["Cast Iron", "Stainless Steel", "Glass", "Plastic", "Ceramic"],
    color: ["Black", "White", "Blue", "Red", "Grey"],
    sizeLabel: "Size",
    sizes: ["Small", "Medium", "Large", "10cm", "20cm", "26cm", "1L", "2L"],
  },
  "home-bedding": {
    brands: ["MUJI", "IKEA", "H&M Home", "Zara Home", "Boll & Branch", "The White Company", "Brooklinen"],
    models: ["Linen Sheet Set", "Duvet Cover", "Cotton Pillowcase", "Quilted Bedspread", "Throw Blanket", "Mattress Topper", "Pillow Set"],
    variants: ["White", "Grey", "Oatmeal", "Navy", "Sage", "Blush", "Striped"],
    priceRange: [8, 120],
    material: ["Linen", "Cotton", "Egyptian Cotton", "Microfiber", "Bamboo"],
    color: ["White", "Grey", "Beige", "Navy", "Green", "Pink"],
    sizeLabel: "UK Size",
    sizes: ["Single", "Double", "King", "Super King", "Standard", "50x70cm"],
  },

  /* Electronics */
  "electronics-phones": {
    brands: ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Nothing", "Sony"],
    models: ["iPhone 15 Pro", "Galaxy S24 Ultra", "Pixel 8 Pro", "OnePlus 12", "Xiaomi 14 Pro", "Phone 2a", "Xperia 1 V"],
    variants: ["Black 128GB", "White 256GB", "Black 256GB", "Sapphire 128GB", "Silver 512GB", "Navy 256GB"],
    priceRange: [120, 1100],
    sizeLabel: "Storage",
    sizes: ["128GB", "256GB", "512GB", "1TB"],
  },
  "electronics-tablets": {
    brands: ["Apple", "Samsung", "Amazon", "Lenovo", "Microsoft", "Google"],
    models: ["iPad Air M2", "Galaxy Tab S9", "Fire HD 11", "Tab P12 Pro", "Surface Pro 10", "Pixel Tablet"],
    variants: ["Space Grey", "Starlight", "Silver", "Graphite", "Beige"],
    priceRange: [60, 850],
    sizeLabel: "Storage",
    sizes: ["64GB", "128GB", "256GB", "512GB"],
  },
  "electronics-laptops": {
    brands: ["Apple", "Dell", "Lenovo", "HP", "ASUS", "Microsoft", "Framework"],
    models: ["MacBook Air M3", "XPS 15", "ThinkPad X1 Carbon", "Spectre x360", "ZenBook 14", "Surface Laptop 6", "Laptop 16"],
    variants: ["Silver", "Space Grey", "Black", "Platinum", "Midnight", "Rose Gold"],
    priceRange: [150, 1900],
    sizeLabel: "RAM/Storage",
    sizes: ["8GB/256GB", "16GB/512GB", "16GB/1TB", "32GB/1TB"],
  },
  "electronics-audio": {
    brands: ["Sony", "Apple", "Bose", "Bang & Olufsen", "Sennheiser", "Marshall", "Sonos", "AirPods"],
    models: ["WH-1000XM5", "AirPods Pro 2", "QC45", "Beosound A1 Gen 2", "Momentum 4", "Stanmore II", "Era 100", "AirPods 4"],
    variants: ["Silver", "Black", "White", "Anthracite", "Midnight", "Brown", "Cream"],
    priceRange: [18, 380],
    sizeLabel: "Model",
    sizes: ["Standard", "One Size"],
  },
  "electronics-cameras": {
    brands: ["Sony", "Canon", "Fujifilm", "Nikon", "Leica", "GoPro", "DJI"],
    models: ["Alpha A7 IV", "EOS R6 Mark II", "X-T5", "Z8", "Q3", "Hero 12 Black", "Osmo Pocket 3"],
    variants: ["Body Only", "With Kit Lens", "With Zoom Lens", "Standard"],
    priceRange: [80, 3500],
    sizeLabel: "Megapixels",
    sizes: ["24MP", "33MP", "40MP", "47MP", "61MP"],
  },
  "electronics-gaming": {
    brands: ["Nintendo", "Sony", "Microsoft", "Valve", "Razer", "Logitech", "SteelSeries"],
    models: ["Switch OLED", "PS5 Slim", "Xbox Series X", "Steam Deck OLED", "Pro Controller", "G Pro X Headset", "Apex 3 Keyboard"],
    variants: ["White", "Black", "Neon Blue/Red", "Carbon Black", "Limited Edition", "Standard"],
    priceRange: [15, 420],
    sizeLabel: "Storage",
    sizes: ["Standard", "64GB", "256GB", "512GB", "1TB"],
  },

  /* Hobbies & Collectibles */
  "hobbies-collectibles": {
    brands: ["LEGO", "Hot Wheels", "Funko", "Disney", "Marvel", "Star Wars", "Mattel"],
    models: ["Collector's Set", "Limited Figure", "Die-Cast Car", "LEGO Icons Set", "Funko Pop Figure", "Signed Memorabilia", "Comic Book"],
    variants: ["Standard Edition", "Limited Edition", "Signed", "Display Case"],
    priceRange: [8, 250],
    sizeLabel: "Type",
    sizes: ["Small", "Medium", "Large", "One Size"],
  },
  "hobbies-figurines": {
    brands: ["Good Smile Company", "Bandai", "Sideshow", "Kotobukiya", "Hot Toys", "McFarlane", "NECA"],
    models: ["Nendoroid Figure", "Gundam Model Kit", "Statue", "Action Figure", "Scale Figure", "Vinyl Figure", "Model Kit"],
    variants: ["Standard", "DX Edition", "Exclusive Color", "With Base"],
    priceRange: [12, 320],
    sizeLabel: "Scale",
    sizes: ["1/12", "1/10", "1/8", "1/7", "1/6", "1/4", "Nendoroid"],
  },
  "hobbies-trading-cards": {
    brands: ["Pokemon", "Magic: The Gathering", "Yu-Gi-Oh!", "One Piece", "Disney Lorcana", "Sports Cards", "Dragon Ball"],
    models: ["Booster Box", "Booster Pack", "Single Card", "Elite Trainer Box", "Binder Collection", "Graded Card", "Starter Deck"],
    variants: ["Sealed", "Near Mint", "Graded PSA 9", "Graded PSA 10", "Lightly Played"],
    priceRange: [5, 180],
    sizeLabel: "Pack Size",
    sizes: ["Single Pack", "Booster Box (36pk)", "ETB", "Set of 10", "Set of 100"],
  },

  /* Sports */
  "sports-fitness": {
    brands: ["Nike", "Adidas", "Peloton", "Gymshark", "Under Armour", "Theragun", "TRX", "Rogue"],
    models: ["Yoga Mat", "Dumbbell Set", "Resistance Bands", "Foam Roller", "Kettlebell", "Jump Rope", "Gym Bag", "Water Bottle"],
    variants: ["Black", "Navy", "Grey", "Purple", "Teal", "Pink", "Coral"],
    priceRange: [5, 120],
    material: ["Rubber", "Neoprene", "Nylon", "Steel", "PVC"],
    color: ["Black", "Navy", "Grey", "Purple", "Blue", "Pink"],
    sizeLabel: "Weight",
    sizes: ["Light", "Medium", "Heavy", "1kg", "2kg", "5kg", "10kg", "15kg", "20kg"],
  },
  "sports-outdoor": {
    brands: ["Patagonia", "The North Face", "Arc'teryx", "Columbia", "Helly Hansen", "Black Diamond", "Salomon", "Mountain Hardwear"],
    models: ["Fleece Jacket", "Hiking Backpack", "Trekking Poles", "Waterproof Shell", "Camping Stove", "Sleeping Bag", "Headlamp", "Insulated Vest"],
    variants: ["Black", "Navy", "Red", "Green", "Orange", "Blue", "Grey"],
    priceRange: [12, 280],
    material: ["Gore-Tex", "Nylon", "Polyester", "Down", "Aluminum"],
    color: ["Black", "Navy", "Red", "Green", "Orange", "Blue", "Grey"],
    sizeLabel: "Size",
    sizes: ["S", "M", "L", "XL", "XXL", "One Size"],
  },
  "sports-cycling": {
    brands: ["Brompton", "Trek", "Specialized", "Canyon", "Giant", "Rapha", "Garmin", "Shimano"],
    models: ["C Line Folding Bike", "Domane SL 5", "Allez Sprint", "Aeroad CF SLX", "Defy Advanced", "Pro Team Jersey", "Edge 540", "105 Groupset"],
    variants: ["Racing Green", "Black", "White", "Red", "Blue", "Grey", "Team Issue"],
    priceRange: [18, 1800],
    material: ["Steel", "Carbon Fibre", "Aluminum", "Titanium", "Wool Blend"],
    color: ["Green", "Black", "White", "Red", "Blue", "Grey"],
    sizeLabel: "Frame",
    sizes: ["XS", "S", "M", "L", "XL", "Standard", "Compact"],
  },
};

/* ───── seller seed data ───── */

interface SellerDef {
  name: string;
  email: string;
  location: string;
}

const SELLERS: SellerDef[] = [
  { name: "Sophia Chen", email: "sophia@example.com", location: "San Francisco, CA" },
  { name: "Marcus Rivera", email: "marcus@example.com", location: "New York, NY" },
  { name: "Emma Larsson", email: "emma@example.com", location: "Stockholm, Sweden" },
  { name: "James Okafor", email: "james@example.com", location: "London, UK" },
  { name: "Isabella Moretti", email: "isabella@example.com", location: "Milan, Italy" },
  { name: "Alex Thompson", email: "alex@example.com", location: "Austin, TX" },
  { name: "Yuki Tanaka", email: "yuki@example.com", location: "Tokyo, Japan" },
  { name: "Olivia Patel", email: "olivia@example.com", location: "Mumbai, India" },
  { name: "Liam O'Brien", email: "liam@example.com", location: "Dublin, Ireland" },
  { name: "Noah Kim", email: "noah@example.com", location: "Seoul, South Korea" },
  { name: "Aria Dupont", email: "aria@example.com", location: "Paris, France" },
  { name: "Ethan Müller", email: "ethan@example.com", location: "Berlin, Germany" },
];

/* ───── brands from product defs ───── */

function collectBrands(): { name: string; slug: string }[] {
  const seen = new Set<string>();
  const brands: { name: string; slug: string }[] = [];
  for (const def of Object.values(PRODUCT_DEFS)) {
    for (const name of def.brands) {
      const slug = slugify(name);
      if (!seen.has(slug)) {
        seen.add(slug);
        brands.push({ name, slug });
      }
    }
  }
  brands.sort((a, b) => a.name.localeCompare(b.name));
  return brands;
}

/* ───── generate products ───── */

interface GeneratedProduct {
  title: string;
  description: string;
  price: number;
  brand: string;
  size: string;
  condition: Condition;
  material: string | null;
  color: string | null;
  images: string[];
  categoryId: string;
  categoryPath: string[];
  likesCount: number;
  status: ListingStatus;
  isPromoted: boolean;
  shippingFree: boolean;
  dedupeKey: string;
}

function generateDescription(brand: string, model: string, variant: string, condition: Condition): string {
  const conditionText: Record<Condition, string> = {
    new_with_tags: "Brand new with original tags attached.",
    new_without_tags: "Brand new without tags. Never worn or used.",
    very_good: "In excellent condition. Worn once or twice, like new.",
    good: "In good condition with normal signs of wear.",
    satisfactory: "Shows visible signs of wear but still plenty of life left.",
  };
  return `${brand} ${model} — ${variant}. ${conditionText[condition]}`;
}

/* Real, category-matched product photos (see seed-images.ts). Galleries are
   cycled in shuffled order so a photo isn't reused until its pool is exhausted. */
function makeGalleryPicker(categoryId: string) {
  const pool = PRODUCT_IMAGE_POOLS[categoryId];
  if (!pool || pool.length === 0) throw new Error(`No image pool for category ${categoryId}`);
  let order: string[][] = [];
  return (): string[] => {
    if (order.length === 0) order = [...pool].sort(() => Math.random() - 0.5);
    const gallery = order.pop()!;
    return Math.random() < 0.4 ? gallery.slice(0, 3) : gallery.slice(0, 1);
  };
}

function generateProducts(): GeneratedProduct[] {
  const products: GeneratedProduct[] = [];
  const seen = new Set<string>();

  /* Pick ~12 representative categories to make each one data-rich */
  const TARGET_CATS = [
    "women-clothing-dresses",
    "women-clothing-tops",
    "women-clothing-jackets",
    "women-shoes-sneakers",
    "women-bags-crossbody",
    "men-clothing-tshirts",
    "men-clothing-hoodies",
    "men-shoes-sneakers",
    "men-acc-watches",
    "designer-bags",
    "home-decor",
    "electronics-audio",
    "electronics-phones",
    "electronics-gaming",
    "sports-outdoor",
  ];

  /* 500 listings, weighted by image-pool size so small pools aren't over-reused */
  const TOTAL_PRODUCTS = 500;
  const weights = TARGET_CATS.map((id) => (PRODUCT_IMAGE_POOLS[id]?.length ?? 0) + 12);
  const weightSum = weights.reduce((x, y) => x + y, 0);
  const catAllocation = TARGET_CATS.map((id, i) => ({
    id,
    count: Math.floor((TOTAL_PRODUCTS * weights[i]!) / weightSum),
  }));
  let leftover = TOTAL_PRODUCTS - catAllocation.reduce((x, c) => x + c.count, 0);
  for (let i = 0; leftover > 0; i = (i + 1) % catAllocation.length, leftover--) catAllocation[i]!.count++;

  for (const alloc of catAllocation) {
    const def = PRODUCT_DEFS[alloc.id];
    if (!def) {
      continue;
    }

    const nextGallery = makeGalleryPicker(alloc.id);
    const maxAttempts = 2000;
    let attempts = 0;
    let generated = 0;

    while (generated < alloc.count && attempts < maxAttempts) {
      attempts++;
      const brand = pick(def.brands);
      const model = pick(def.models);
      const variant = pick(def.variants);
      const size = pick(def.sizes);
      const dedupeKey = `${brand}|${model}|${variant}|${size}`;

      if (seen.has(dedupeKey)) {
        continue;
      }
      seen.add(dedupeKey);

      const price = randInt(def.priceRange[0], def.priceRange[1]);
      const conditionWeights = [0.12, 0.18, 0.35, 0.25, 0.10];
      const r = Math.random();
      let condIdx = 0;
      let cum = 0;
      for (let i = 0; i < conditionWeights.length; i++) {
        cum += conditionWeights[i]!;
        if (r <= cum) { condIdx = i; break; }
      }
      const condition = CONDITION_VALUES[condIdx]!;

      const material = def.material ? pick(def.material) : null;
      const color = def.color ? pick(def.color) : null;

      const title = `${brand} ${model} - ${variant}`;

      // find the category path
      const catIds = alloc.id.split("-");
      const catPath: string[] = [];
      let current: CatDef | undefined;
      for (let i = 0; i < catIds.length; i++) {
        const partial = catIds.slice(0, i + 1).join("-");
        const tree = current?.children ?? CATEGORY_TREE;
        current = tree.find((c) => c.id === partial);
        if (current) catPath.push(current.name);
      }

      const statusRand = Math.random();
      const status: ListingStatus =
        statusRand < 0.75 ? "active" :
        statusRand < 0.88 ? "sold" :
        statusRand < 0.96 ? "reserved" :
        "deactivated";

      const isPromoted = Math.random() < 0.12;
      const shippingFree = Math.random() < 0.55;

      // likes: skewed low
      let likesCount: number;
      const likesRoll = Math.random();
      if (likesRoll < 0.70) {
        likesCount = randInt(0, 20);
      } else if (likesRoll < 0.95) {
        likesCount = randInt(21, 150);
      } else {
        likesCount = randInt(151, 450);
      }

      const images = nextGallery();

      products.push({
        title: title.length > 80 ? title.slice(0, 77) + "..." : title,
        description: generateDescription(brand, model, variant, condition),
        price,
        brand,
        size,
        condition,
        material,
        color,
        images,
        categoryId: alloc.id,
        categoryPath: catPath,
        likesCount,
        status,
        isPromoted,
        shippingFree,
        dedupeKey,
      });

      generated++;
    }
  }

  return products;
}

/* ───── main seed ───── */

async function main() {
  console.log("🌱 Wearnova seed starting...\n");

  /* ── Step 0: purge existing product/order data ── */
  console.log("Purging existing data (respecting FK constraints)...");
  await prisma.transaction.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.dispute.deleteMany();
  await prisma.order.deleteMany();
  await prisma.questionReply.deleteMany();
  await prisma.productQuestion.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.promoCode.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.report.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("Data purged. Verifying zero listings exist...");
  const listingCountBefore = await prisma.listing.count();
  console.log(`  Listing count: ${listingCountBefore}`);
  if (listingCountBefore > 0) {
    throw new Error("Failed to purge listings!");
  }
  console.log("  ✓ All clear\n");

  /* ── Seed admin + seller users ── */
  console.log("Seeding users...");

  const adminPw = await bcrypt.hash("Admin@123456", 12);
  const userPw = await bcrypt.hash("User@123456", 12);

  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@wearnova.com",
      password: adminPw,
      role: "admin",
    },
  });

  const sellerRecords: { id: string; name: string }[] = [];
  for (const s of SELLERS) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        password: userPw,
        role: "user",
        isPhoneVerified: true, // seeded accounts skip the SMS verification gate at login
        location: s.location,
        verifiedMethods: ["Email"],
        badges: [],
        // Dev-only placeholder Connect ids so seeded listings are purchasable up to
        // the payment step. Real payouts need a real Stripe Connect onboarding.
        ...(process.env.NODE_ENV === "production"
          ? {}
          : { stripeAccountId: `acct_dev_${s.email.split("@")[0]}`, stripePayoutsEnabled: true }),
      },
    });
    sellerRecords.push({ id: user.id, name: user.name });
  }
  console.log(`  Created ${1 + sellerRecords.length} users\n`);

  /* ── Seed promo codes ── */
  await prisma.promoCode.createMany({
    data: [
      { code: "WELCOME10", type: "percent", value: 10 },
      { code: "SAVE5", type: "fixed", value: 5, minOrder: 30 },
      { code: "FREESHIP", type: "free_shipping", value: 0 },
      { code: "EXPIRED10", type: "percent", value: 10, expiresAt: new Date("2026-01-01") },
    ],
  });
  console.log("  Created promo codes\n");

  /* ── Seed categories ── */
  console.log("Seeding categories...");
  async function seedCategoryTree(nodes: CatDef[], parentId: string | null = null) {
    for (const node of nodes) {
      const icon = node.children && node.children.length > 0 ? undefined : null;
      await prisma.category.create({
        data: {
          id: node.id,
          name: node.name,
          slug: node.slug,
          icon: icon ?? null,
          parentId,
        },
      });
      if (node.children && node.children.length > 0) {
        await seedCategoryTree(node.children, node.id);
      }
    }
  }
  await seedCategoryTree(CATEGORY_TREE);
  const catCount = await prisma.category.count();
  console.log(`  Created ${catCount} categories\n`);

  /* ── Seed brands ── */
  console.log("Seeding brands...");
  const allBrands = collectBrands();
  for (const b of allBrands) {
    await prisma.brand.create({
      data: {
        name: b.name,
        slug: b.slug,
        logoLetter: b.name.charAt(0).toUpperCase(),
        productCount: 0,
      },
    });
  }
  const brandCount = await prisma.brand.count();
  console.log(`  Created ${brandCount} brands\n`);

  /* ── Generate & seed products ── */
  console.log("Generating product listings...");
  const generated = generateProducts();

  if (generated.length < 100) {
    console.warn(`  ⚠ Only generated ${generated.length} products — generating more...`);
    /* could loop more, but the defs should produce 120+ */
  }

  console.log(`  Total candidates before dedupe: ${generated.length}`);

  /* dedupe check done during generation via seen set, so all are unique */
  console.log(`  Unique products to insert: ${generated.length}\n`);

  console.log("Inserting listings...");
  let insertedCount = 0;
  for (const prod of generated) {
    const seller = sellerRecords[insertedCount % sellerRecords.length]!;

    const uploadedAt = faker.date.between({
      from: new Date("2026-01-15"),
      to: new Date("2026-07-28"),
    });

    try {
      await prisma.listing.create({
        data: {
          title: prod.title,
          description: prod.description,
          price: prod.price,
          brand: prod.brand,
          size: prod.size,
          condition: prod.condition,
          material: prod.material,
          color: prod.color,
          images: prod.images,
          sellerId: seller.id,
          categoryId: prod.categoryId,
          categoryPath: prod.categoryPath,
          likesCount: prod.likesCount,
          uploadedAt,
          status: prod.status,
          // Units still available: sold and reserved items have none left.
          quantity: prod.status === "active" || prod.status === "deactivated" ? 1 : 0,
          isPromoted: prod.isPromoted,
          shippingFree: prod.shippingFree,
        },
      });
      insertedCount++;
    } catch (err) {
      console.error(`  ✗ Failed to insert "${prod.title}":`, (err as Error).message);
    }
  }
  console.log(`  Inserted ${insertedCount} listings\n`);

  /* ── Seed follows ── */
  console.log("Seeding follows...");
  const allUsers = await prisma.user.findMany({ select: { id: true }, where: { role: "user" } });
  let followCount = 0;
  for (const user of allUsers) {
    const targets = allUsers.filter((u) => u.id !== user.id);
    const pickCount = randInt(2, 6);
    for (let i = 0; i < pickCount; i++) {
      const target = pick(targets);
      try {
        await prisma.follow.create({
          data: { followerId: user.id, followingId: target.id },
        });
        followCount++;
      } catch {
        /* unique constraint — already following */
      }
    }
  }
  for (const user of allUsers) {
    const [followersCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
    ]);
    await prisma.user.update({ where: { id: user.id }, data: { followersCount, followingCount } });
  }
  console.log(`  Created ${followCount} follows\n`);

  /* ── Seed questions & replies ── */
  console.log("Seeding questions & comments...");
  const questionTemplates = [
    "Hi! Is this item still available?",
    "How does the fit run? True to size?",
    "Would you consider shipping internationally?",
    "Are there any flaws or signs of wear?",
    "What material is it made from?",
    "Do you have this in a different size?",
  ];
  const replyTemplates = [
    "Yes, it is! Feel free to make an offer.",
    "It fits true to size in my experience.",
    "Happy to ship internationally at cost.",
    "It's in great condition — no flaws.",
    "It's a high-quality fabric, very comfortable.",
    "I only have this size, sorry!",
  ];
  const listingIds = (
    await prisma.listing.findMany({
      where: { status: "active" },
      select: { id: true, sellerId: true },
      take: 36,
    })
  ).filter((l) => allUsers.some((u) => u.id !== l.sellerId));
  let questionCount = 0;
  let replyCount = 0;
  for (const listing of listingIds) {
    const questionId = `seed-question-${listing.id}`;
    const buyer = pick(allUsers.filter((u) => u.id !== listing.sellerId));
    const hasReply = Math.random() < 0.6;
    const templateIdx = questionCount % questionTemplates.length;
    try {
      await prisma.productQuestion.create({
        data: {
          id: questionId,
          listingId: listing.id,
          authorId: buyer.id,
          text: questionTemplates[templateIdx]!,
          createdAt: faker.date.between({
            from: new Date("2026-05-01"),
            to: new Date("2026-07-28"),
          }),
        },
      });
      questionCount++;
      if (hasReply) {
        await prisma.questionReply.create({
          data: {
            id: `seed-reply-${listing.id}`,
            questionId,
            authorId: listing.sellerId,
            text: replyTemplates[templateIdx]!,
            createdAt: faker.date.between({
              from: new Date("2026-05-02"),
              to: new Date("2026-07-29"),
            }),
          },
        });
        replyCount++;
      }
    } catch (err) {
      console.error(
        `  ✗ Failed to seed question for "${listing.id}":`,
        (err as Error).message,
      );
    }
  }
  console.log(`  Created ${questionCount} questions, ${replyCount} replies\n`);

  /* ── Verification ── */
  /* ── Seed orders (on the sold listings created above) ── */
  console.log("Seeding orders...");
  await seedOrders(prisma);
  console.log("");

  console.log("=== VERIFICATION ===");
  const finalCount = await prisma.listing.count();
  console.log(`  Total listings: ${finalCount}`);

  if (finalCount < 100) {
    throw new Error(`FAIL: Only ${finalCount} products — need at least 100`);
  }

  /* check duplicates by brand+title+size */
  const all = await prisma.listing.findMany({
    select: { brand: true, title: true, size: true },
  });
  const keyCounts = new Map<string, number>();
  for (const l of all) {
    const key = `${l.brand}|${l.title}|${l.size}`;
    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
  }
  let duplicates = 0;
  for (const [key, count] of keyCounts) {
    if (count > 1) {
      duplicates++;
      console.warn(`  DUPLICATE: "${key}" appears ${count} times`);
    }
  }

  if (duplicates === 0) {
    console.log("  Duplicates: 0 ✓");
  }

  /* per-category spread */
  const byCat = await prisma.listing.groupBy({
    by: ["categoryId"],
    _count: true,
  });
  console.log(`  Categories used: ${byCat.length}`);
  for (const c of byCat) {
    const cat = await prisma.category.findUnique({ where: { id: c.categoryId } });
    console.log(`    ${cat?.name ?? c.categoryId}: ${c._count}`);
  }

  console.log("\n🌱 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
