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
  { path: "/images/food/nyamachoma.webp", label: "Nyama choma" },
  { path: "/images/food/pilaubeef.webp", label: "Pilau Beef" },
  { path: "/images/food/chapatib.webp", label: "Chapati Beans" },
  { path: "/images/food/chapatid.webp", label: "Chapati Ndengu" },
  { path: "/images/food/ugalinyamasukuma.webp", label: "Ugali Nyama Sukuma" },
  { path: "/images/food/coffee.webp", label: "Coffee" },
  { path: "/images/food/predator.webp", label: "Predator" },
  { path: "/images/food/minute.webp", label: "Minute Maid" },
  { path: "/images/food/chai.jpg", label: "Chai" },
  { path: "/images/food/mahindb.webp", label: "Mahindi Boil" },
  { path: "/images/food/mahindic.webp", label: "Mahindi Choma" },
  { path: "/images/food/mukimo.jpg", label: "Mukimo" },
  { path: "/images/food/kachumbari.jpg", label: "Kachumbari" },
  { path: "/images/food/samosabeef.webp", label: "Samosa Beef" },
  { path: "/images/food/stoney.webp", label: "Stoney Tangawizi" },
  { path: "/images/food/ujipower.webp", label: "Uji Power" },
  { path: "/images/food/biryani.webp", label: "Fish fry" },
  { path: "/images/food/chaim.webp", label: "Chai Mandazi" },
  { path: "/images/food/kukuchoma.webp", label: "Kuku Choma" },
  { path: "/images/food/nyamachoma.webp", label: "Nyama Choma" },
  { path: "/images/food/githeri.webp", label: "Githeri" },
  { path: "/images/food/dawa.webp", label: "Dawa Drink" },
];
