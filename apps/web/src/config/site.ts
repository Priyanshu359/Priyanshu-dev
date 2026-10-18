export const siteConfig = {
  name: "Priyanshu Sinha",
  title: "Priyanshu Sinha — Backend Engineer",
  tagline: "I build the backends that keep products fast — and the AI that runs on top of them.",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || "priyanshu.dev",
  apiDomain: process.env.NEXT_PUBLIC_API_DOMAIN || "api.priyanshu.dev",
  get apiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || `https://${this.apiDomain}`;
  },
  socials: {
    github: "https://github.com",
    linkedin: "https://linkedin.com",
    email: "priyanshu.kr.sinha74@gmail.com",
    resume: "/resume.pdf",
  },
};
