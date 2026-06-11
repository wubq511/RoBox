import {
  BlocksIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  StarIcon,
  WrenchIcon,
  WandSparklesIcon,
} from "lucide-react";

export const navigationItems = [
  {
    href: "/dashboard",
    label: "总览",
    icon: LayoutDashboardIcon,
  },
  {
    href: "/ai-search",
    label: "AI检索",
    icon: SearchIcon,
  },
  {
    href: "/favorites",
    label: "收藏",
    icon: StarIcon,
  },
  {
    href: "/prompts",
    label: "Prompts",
    icon: BlocksIcon,
  },
  {
    href: "/skills",
    label: "Skills",
    icon: WandSparklesIcon,
  },
  {
    href: "/tools",
    label: "Tools",
    icon: WrenchIcon,
  },
  {
    href: "/settings",
    label: "设置",
    icon: SettingsIcon,
  },
] as const;
