/** `public/pet` 下食物图与数值（饱食度 / 心情值，单次喂食增量，上限 100） */
export type PetFoodItem = {
  id: string;
  /** 文件名，含扩展名，与 public/pet 一致 */
  file: string;
  label: string;
  hunger: number;
  mood: number;
};

export const PET_FOODS: PetFoodItem[] = [
  { id: "cheeseburger", file: "cheeseburger.png", label: "芝士汉堡", hunger: 26, mood: 12 },
  { id: "rice-ball", file: "rice ball.png", label: "饭团", hunger: 18, mood: 15 },
  { id: "egg-tart", file: "egg tart.png", label: "蛋挞", hunger: 10, mood: 14 },
  { id: "pineapple-bun", file: "pineapple bun.png", label: "菠萝包", hunger: 12, mood: 16 },
  { id: "swiss-roll", file: "Swiss roll.png", label: "瑞士卷", hunger: 8, mood: 18 },
  { id: "matcha-cake", file: "matcha cake.png", label: "抹茶蛋糕", hunger: 10, mood: 20 },
  {
    id: "strawberry-sundae",
    file: "strawberry sundae.png",
    label: "草莓圣代",
    hunger: 6,
    mood: 22,
  },
  { id: "pudding", file: "pudding.png", label: "布丁", hunger: 6, mood: 12 },
];

export function petFoodImageSrc(file: string): string {
  return `/pet/${encodeURIComponent(file)}`;
}
