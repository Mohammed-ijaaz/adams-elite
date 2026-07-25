export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  barcode: string;
  image: string;
  images: string[];
  featured: boolean;
  description: string;
  rentalAvailable: boolean;
  rentalPrice: number | null;
  advanceAmount: number | null;
  gstPercent: number;
  stockQuantity: number;
  footwearSize: string;
  footwearColour: string;
}

export const fallbackProducts: Product[] = [
  {
    id: 1,
    name: "Bridal Necklace Set",
    category: "Bridal Collection",
    price: 2999,
    barcode: "",
    image: "/images/categories/bridal.jpeg",
    images: ["/images/categories/bridal.jpeg"],
    featured: true,
    description:
      "A premium bridal necklace set designed for elegant wedding and reception looks.",
    rentalAvailable: true,
    rentalPrice: 1499,
    advanceAmount: 1000,
    gstPercent: 3,
    stockQuantity: 10,
    footwearSize: "",
    footwearColour: "",
  },
  {
    id: 2,
    name: "Fashion Jewellery Set",
    category: "Fashion Jewellery",
    price: 999,
    barcode: "",
    image: "/images/categories/fashion.jpeg",
    images: ["/images/categories/fashion.jpeg"],
    featured: true,
    description:
      "A stylish fashion jewellery set suitable for parties, casual outings and gifting.",
    rentalAvailable: false,
    rentalPrice: null,
    advanceAmount: null,
    gstPercent: 3,
    stockQuantity: 10,
    footwearSize: "",
    footwearColour: "",
  },
  {
    id: 3,
    name: "Luxury Rental Jewellery Set",
    category: "Rental Jewellery",
    price: 1499,
    barcode: "",
    image: "/images/categories/rentals.jpeg",
    images: ["/images/categories/rentals.jpeg"],
    featured: true,
    description:
      "A luxury jewellery set available for rental, perfect for special occasions.",
    rentalAvailable: true,
    rentalPrice: 1499,
    advanceAmount: 1000,
    gstPercent: 3,
    stockQuantity: 10,
    footwearSize: "",
    footwearColour: "",
  },
  {
    id: 4,
    name: "Imported Perfume",
    category: "Perfumes",
    price: 1299,
    barcode: "",
    image: "/images/categories/perfumes.jpeg",
    images: ["/images/categories/perfumes.jpeg"],
    featured: true,
    description:
      "An imported perfume with a premium fragrance profile for everyday elegance.",
    rentalAvailable: false,
    rentalPrice: null,
    advanceAmount: null,
    gstPercent: 18,
    stockQuantity: 10,
    footwearSize: "",
    footwearColour: "",
  },
];