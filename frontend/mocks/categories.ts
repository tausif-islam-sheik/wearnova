import type { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "women",
    name: "Women",
    slug: "women",
    subcategories: [
      {
        id: "women-clothing",
        name: "Clothing",
        slug: "clothing",
        subcategories: [
          { id: "women-clothing-jumpers", name: "Jumpers & Sweaters", slug: "jumpers-sweaters", subcategories: [] },
          { id: "women-clothing-dresses", name: "Dresses", slug: "dresses", subcategories: [] },
          { id: "women-clothing-tops", name: "Tops & T-Shirts", slug: "tops-tshirts", subcategories: [] },
          { id: "women-clothing-jeans", name: "Jeans", slug: "jeans", subcategories: [] },
          { id: "women-clothing-jackets", name: "Jackets & Coats", slug: "jackets-coats", subcategories: [] },
          { id: "women-clothing-skirts", name: "Skirts", slug: "skirts", subcategories: [] },
          { id: "women-clothing-shorts", name: "Shorts", slug: "shorts", subcategories: [] },
          { id: "women-clothing-trousers", name: "Trousers", slug: "trousers", subcategories: [] },
          { id: "women-clothing-activewear", name: "Activewear", slug: "activewear", subcategories: [] },
        ],
      },
      {
        id: "women-shoes",
        name: "Shoes",
        slug: "shoes",
        subcategories: [
          { id: "women-shoes-sneakers", name: "Sneakers", slug: "sneakers", subcategories: [] },
          { id: "women-shoes-heels", name: "Heels", slug: "heels", subcategories: [] },
          { id: "women-shoes-boots", name: "Boots", slug: "boots", subcategories: [] },
          { id: "women-shoes-flats", name: "Flats", slug: "flats", subcategories: [] },
          { id: "women-shoes-sandals", name: "Sandals", slug: "sandals", subcategories: [] },
        ],
      },
      {
        id: "women-bags",
        name: "Bags",
        slug: "bags",
        subcategories: [
          { id: "women-bags-handbags", name: "Handbags", slug: "handbags", subcategories: [] },
          { id: "women-bags-backpacks", name: "Backpacks", slug: "backpacks", subcategories: [] },
          { id: "women-bags-crossbody", name: "Crossbody Bags", slug: "crossbody", subcategories: [] },
          { id: "women-bags-totes", name: "Totes", slug: "totes", subcategories: [] },
        ],
      },
      {
        id: "women-accessories",
        name: "Accessories",
        slug: "accessories",
        subcategories: [
          { id: "women-acc-jewellery", name: "Jewellery", slug: "jewellery", subcategories: [] },
          { id: "women-acc-scarves", name: "Scarves", slug: "scarves", subcategories: [] },
          { id: "women-acc-hats", name: "Hats", slug: "hats", subcategories: [] },
          { id: "women-acc-belts", name: "Belts", slug: "belts", subcategories: [] },
          { id: "women-acc-sunglasses", name: "Sunglasses", slug: "sunglasses", subcategories: [] },
        ],
      },
      {
        id: "women-beauty",
        name: "Beauty",
        slug: "beauty",
        subcategories: [
          { id: "women-beauty-skincare", name: "Skincare", slug: "skincare", subcategories: [] },
          { id: "women-beauty-makeup", name: "Makeup", slug: "makeup", subcategories: [] },
          { id: "women-beauty-fragrance", name: "Fragrance", slug: "fragrance", subcategories: [] },
        ],
      },
    ],
  },
  {
    id: "men",
    name: "Men",
    slug: "men",
    subcategories: [
      {
        id: "men-clothing",
        name: "Clothing",
        slug: "clothing",
        subcategories: [
          { id: "men-clothing-tshirts", name: "T-Shirts", slug: "tshirts", subcategories: [] },
          { id: "men-clothing-shirts", name: "Shirts", slug: "shirts", subcategories: [] },
          { id: "men-clothing-jeans", name: "Jeans", slug: "jeans", subcategories: [] },
          { id: "men-clothing-jackets", name: "Jackets & Coats", slug: "jackets-coats", subcategories: [] },
          { id: "men-clothing-trousers", name: "Trousers", slug: "trousers", subcategories: [] },
          { id: "men-clothing-hoodies", name: "Hoodies & Sweatshirts", slug: "hoodies-sweatshirts", subcategories: [] },
        ],
      },
      {
        id: "men-shoes",
        name: "Shoes",
        slug: "shoes",
        subcategories: [
          { id: "men-shoes-sneakers", name: "Sneakers", slug: "sneakers", subcategories: [] },
          { id: "men-shoes-boots", name: "Boots", slug: "boots", subcategories: [] },
          { id: "men-shoes-loafers", name: "Loafers", slug: "loafers", subcategories: [] },
        ],
      },
      {
        id: "men-accessories",
        name: "Accessories",
        slug: "accessories",
        subcategories: [
          { id: "men-acc-watches", name: "Watches", slug: "watches", subcategories: [] },
          { id: "men-acc-wallets", name: "Wallets", slug: "wallets", subcategories: [] },
          { id: "men-acc-belts", name: "Belts", slug: "belts", subcategories: [] },
          { id: "men-acc-hats", name: "Hats", slug: "hats", subcategories: [] },
        ],
      },
    ],
  },
  {
    id: "designer",
    name: "Designer",
    slug: "designer",
    subcategories: [
      { id: "designer-bags", name: "Designer Bags", slug: "bags", subcategories: [] },
      { id: "designer-shoes", name: "Designer Shoes", slug: "shoes", subcategories: [] },
      { id: "designer-clothing", name: "Designer Clothing", slug: "clothing", subcategories: [] },
      { id: "designer-accessories", name: "Designer Accessories", slug: "accessories", subcategories: [] },
    ],
  },
  {
    id: "kids",
    name: "Kids",
    slug: "kids",
    subcategories: [
      { id: "kids-clothing", name: "Kids Clothing", slug: "clothing", subcategories: [] },
      { id: "kids-shoes", name: "Kids Shoes", slug: "shoes", subcategories: [] },
      { id: "kids-toys", name: "Toys & Games", slug: "toys-games", subcategories: [] },
      { id: "kids-strollers", name: "Strollers & Car Seats", slug: "strollers-car-seats", subcategories: [] },
    ],
  },
  {
    id: "home",
    name: "Home",
    slug: "home",
    subcategories: [
      { id: "home-furniture", name: "Furniture", slug: "furniture", subcategories: [] },
      { id: "home-decor", name: "Home Decor", slug: "decor", subcategories: [] },
      { id: "home-kitchen", name: "Kitchen", slug: "kitchen", subcategories: [] },
      { id: "home-bedding", name: "Bedding", slug: "bedding", subcategories: [] },
    ],
  },
  {
    id: "electronics",
    name: "Electronics",
    slug: "electronics",
    subcategories: [
      { id: "electronics-phones", name: "Phones", slug: "phones", subcategories: [] },
      { id: "electronics-tablets", name: "Tablets", slug: "tablets", subcategories: [] },
      { id: "electronics-laptops", name: "Laptops & Computers", slug: "laptops", subcategories: [] },
      { id: "electronics-audio", name: "Audio", slug: "audio", subcategories: [] },
      { id: "electronics-cameras", name: "Cameras", slug: "cameras", subcategories: [] },
      { id: "electronics-gaming", name: "Gaming", slug: "gaming", subcategories: [] },
    ],
  },
  {
    id: "entertainment",
    name: "Entertainment",
    slug: "entertainment",
    subcategories: [
      { id: "ent-movies", name: "Movies & TV", slug: "movies-tv", subcategories: [] },
      { id: "ent-music", name: "Music", slug: "music", subcategories: [] },
      { id: "ent-books", name: "Books", slug: "books", subcategories: [] },
      { id: "ent-games", name: "Video Games", slug: "video-games", subcategories: [] },
    ],
  },
  {
    id: "hobbies",
    name: "Hobbies & Collectibles",
    slug: "hobbies-collectibles",
    subcategories: [
      { id: "hobbies-collectibles", name: "Collectibles", slug: "collectibles", subcategories: [] },
      { id: "hobbies-figurines", name: "Figurines", slug: "figurines", subcategories: [] },
      { id: "hobbies-trading-cards", name: "Trading Cards", slug: "trading-cards", subcategories: [] },
    ],
  },
  {
    id: "sports",
    name: "Sports",
    slug: "sports",
    subcategories: [
      { id: "sports-fitness", name: "Fitness Equipment", slug: "fitness-equipment", subcategories: [] },
      { id: "sports-outdoor", name: "Outdoor Gear", slug: "outdoor-gear", subcategories: [] },
      { id: "sports-cycling", name: "Cycling", slug: "cycling", subcategories: [] },
      { id: "sports-camping", name: "Camping", slug: "camping", subcategories: [] },
    ],
  },
];
