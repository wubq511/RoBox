import {
  BlocksIcon,
  LayoutDashboardIcon,
  SettingsIcon,
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
