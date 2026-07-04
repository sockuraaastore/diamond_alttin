import React from 'react';
import { Product } from '../types';
import { Eye, ShieldAlert } from 'lucide-react';

interface ProductCardProps {
  key?: string;
  product: Product;
  onViewDetails: (p: Product) => void;
}

export default function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      id={`product-card-${product.id}`}
      className="group relative bg-[#090909] border border-white/10 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all duration-500 flex flex-col justify-between hover:shadow-[0_4px_25px_rgba(212,175,55,0.08)]"
    >
      {/* Product Image section with Luxury hover overlay */}
      <div className="relative aspect-square w-full overflow-hidden bg-black flex items-center justify-center">
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Absolute indicators */}
        <span className="absolute top-3 right-3 bg-black/75 backdrop-blur-md text-[#D4AF37] border border-[#D4AF37]/20 px-2.5 py-0.5 rounded-full text-[10px] tracking-wide font-sans">
          {product.categoryName}
        </span>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-red-500">
            <ShieldAlert className="w-8 h-8 mb-1.5 text-red-500 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase">اتمام موجودی</span>
          </div>
        )}

        {/* Hover quick view overlay */}
        {!isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
            <button
              onClick={() => onViewDetails(product)}
              className="bg-[#D4AF37] hover:bg-white text-black hover:text-black px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
            >
              <Eye className="w-4 h-4" />
              مشاهده و خرید
            </button>
          </div>
        )}
      </div>

      {/* Product Details info */}
      <div className="p-5 flex flex-col flex-grow text-right dir-rtl">
        <h3 className="font-bold text-white text-sm group-hover:text-[#D4AF37] transition-colors duration-300 mb-1 line-clamp-1">
          {product.title}
        </h3>
        
        <p className="text-xs text-gray-400 line-clamp-2 min-h-[2rem] leading-relaxed mb-4 text-justify">
          {product.description}
        </p>

        {/* Bottom price and inventory status */}
        <div className="flex justify-between items-center mt-auto pt-3 border-t border-white/5">
          <div className="text-right">
            <span className="text-[10px] text-gray-500 block mb-0.5">قیمت:</span>
            <span className="text-sm font-extrabold text-[#D4AF37] font-mono">
              {product.price.toLocaleString('fa-IR')} <span className="text-[10px] text-gray-300 font-sans">تومان</span>
            </span>
          </div>

          <div className="text-left text-xs text-gray-400">
            {product.stock <= 5 && product.stock > 0 ? (
              <span className="text-amber-500 font-semibold">تنها {product.stock} عدد باقی‌مانده</span>
            ) : product.stock > 5 ? (
              <span className="text-gray-500">موجود در انبار</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
