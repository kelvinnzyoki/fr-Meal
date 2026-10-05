// Preset gallery of food images shipped with the frontend, in
// public/images/food/. This file is just a list of paths + labels — it
// doesn't require the files to exist. Add real photos (jpg/jpeg/webp/png,
// any of those extensions work) at the paths below; nothing else needs to
// change once the file is there. Until a path has a real file behind it,
// anything assigned to it will 404 as a broken image on the customer side,
// so only add entries here once the matching file is actually committed to
// public/images/food/.
//
// To add a new option: drop the photo in public/images/food/, then add one
// line below pointing at it. The admin picker (admin/food-images) and this
// file are the only two places that need to know about it.

export interface FoodImageOption {
  path: string;
  label: string;
}

export const FOOD_IMAGE_OPTIONS: FoodImageOption[] = [
  { path: "/images/food/nyamachoma.jpeg", label: "Nyama choma" },
  { path: "/images/food/pilau.jpeg", label: "Pilau" },
  { path: "/images/food/chapatib.jpeg", label: "Chapati Beans" },
  { path: "/images/food/chapatid.jpeg", label: "Chapati Ndengu" },
  { path: "/images/food/ugalinyama.jpeg", label: "Ugali Nyama" },
  { path: "/images/food/coffee.jpg", label: "Coffee" },
  { path: "/images/food/predator.jpg", label: "Predator" },
  { path: "/images/food/minute.jpg", label: "Minute Maid" },
  { path: "/images/food/chai.jpg", label: "Chai" },
  { path: "/images/food/mahindb.jpeg", label: "Mahindi Boil" },
  { path: "/images/food/mahindic.jpeg", label: "Mahindi Choma" },
  { path: "/images/food/mukimo.jpg", label: "Mukimo" },
  { path: "/images/food/kachumbari.jpg", label: "Kachumbari" },
  { path: "/images/food/fish-fry.jpg", label: "Fish fry" },
];
