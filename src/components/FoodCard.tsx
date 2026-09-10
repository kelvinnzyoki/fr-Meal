import Link from "next/link";
import type { FoodItem } from "@/types";

export function FoodCard({ item }: { item: FoodItem }) {
  return (
    <Link
      href={`/food/${item.id}`}
      className="group block bg-white border-2 border-ink/10 rounded-card overflow-hidden hover:border-marigold transition-colors"
    >
      <div className="aspect-[4/3] bg-stone/20 overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
        )}
      </div>
      <div className="p-3">
        {item.vendor && <p className="text-xs text-stone font-medium truncate">{item.vendor.businessName}</p>}
        <h3 className="font-display font-bold text-ink leading-snug mt-0.5 truncate">{item.name}</h3>
        <div className="flex items-baseline justify-between mt-1.5">
          <span className="font-bold text-chili">KES {Number(item.basePrice).toLocaleString()}</span>
          <span className="text-xs text-stone">{item.prepTimeMins} min</span>
        </div>
      </div>
    </Link>
  );
}
