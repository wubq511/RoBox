import {
  BlocksIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  WandSparklesIcon,
} from "lucide-react";

export const navigationItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
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
    href: "/settings",
    label: "Settings",
    icon: SettingsIcon,
  },
] as const;
