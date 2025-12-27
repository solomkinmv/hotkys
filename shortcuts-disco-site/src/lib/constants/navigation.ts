/**
 * Navigation constants for the application
 */

export type NavIconKey = "HelpCircle" | "Raycast";

// Main navigation links (Home excluded since logo links to /)
export const MAIN_NAV_LINKS = [
  { href: "/about", label: "About", icon: "HelpCircle" },
  { href: "/raycast-extension", label: "Raycast Extension", icon: "Raycast" },
] as const satisfies readonly { href: string; label: string; icon: NavIconKey }[];

// Social media links
export const SOCIAL_LINKS = [
  {
    href: "https://twitter.com/solomkinmv",
    label: "Twitter",
    icon: "TwitterIcon"
  },
  {
    href: "https://github.com/solomkinmv/shortcuts-disco",
    label: "GitHub",
    icon: "GithubIcon"
  },
] as const;

// Footer links
export const FOOTER_LINKS = [
  { 
    href: "https://github.com/solomkinmv/shortcuts-disco/issues", 
    label: "Report issues or make a request" 
  },
];
