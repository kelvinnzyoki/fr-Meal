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
  { path: "/images/food/nyama-choma.jpg", label: "Nyama choma" },
  { path: "/images/food/pilau.jpg", label: "Pilau" },
  { path: "/images/food/chapati.jpg", label: "Chapati" },
  { path: "/images/food/mandazi.jpg", label: "Mandazi" },
  { path: "/images/food/ugali-sukuma.jpg", label: "Ugali & sukuma wiki" },
  { path: "/images/food/samosa.jpg", label: "Samosa" },
  { path: "/images/food/githeri.jpg", label: "Githeri" },
  { path: "/images/food/mutura.jpg", label: "Mutura" },
  { path: "/images/food/chai.jpg", label: "Chai" },
  { path: "/images/food/fresh-juice.jpg", label: "Fresh juice" },
  { path: "/images/food/biryani.jpg", label: "Biryani" },
  { path: "/images/food/mukimo.jpg", label: "Mukimo" },
  { path: "/images/food/kachumbari.jpg", label: "Kachumbari" },
  { path: "/images/food/fish-fry.jpg", label: "Fish fry" },
];
