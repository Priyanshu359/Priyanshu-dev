export const siteConfig = {
  name: "Priyanshu Sinha",
  title: "Priyanshu Sinha — Backend Engineer",
  tagline: "I build the backends that keep products fast — and the AI that runs on top of them.",
  domain: process.env.NEXT_PUBLIC_SITE_DOMAIN || "priyanshusinha.dev",
  apiDomain: process.env.NEXT_PUBLIC_API_DOMAIN || "api.priyanshusinha.dev",
  get apiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || `https://${this.apiDomain}`;
  },
  socials: {
    github: "https://github.com/Priyanshu359",
    linkedin: "https://www.linkedin.com/in/priyanshu7",
    email: "priyanshu.kr.sinha74@gmail.com",
    resume: "/resume.pdf",
  },
};
