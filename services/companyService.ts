import { CompanyProfile } from '../types';

const companyProfiles: { [key: string]: Omit<CompanyProfile, 'ticker' | 'name'> } = {
  AAPL: {
    industry: "Consumer Electronics",
    sector: "Technology",
    ceo: "Tim Cook",
    headquarters: "Cupertino, California, USA",
    website: "https://www.apple.com",
    description: "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. It also sells various related services. The company's products include the iPhone, Mac, iPad, AirPods, Apple TV, Apple Watch, and HomePod. It also offers a portfolio of consumer and professional software applications, and sells and delivers digital content and applications through the App Store, Apple Music, Apple TV+, and iCloud."
  },
  GOOGL: {
    industry: "Internet Content & Information",
    sector: "Communication Services",
    ceo: "Sundar Pichai",
    headquarters: "Mountain View, California, USA",
    website: "https://abc.xyz",
    description: "Alphabet Inc. is a holding company that gives ambitious projects the resources to succeed. It is the parent company of Google, which provides a variety of tools and platforms including search, advertising, an operating system, a web browser, and cloud computing services. Other subsidiaries include Waymo (autonomous driving), Verily (life sciences), and DeepMind (AI research)."
  },
  MSFT: {
    industry: "Software—Infrastructure",
    sector: "Technology",
    ceo: "Satya Nadella",
    headquarters: "Redmond, Washington, USA",
    website: "https://www.microsoft.com",
    description: "Microsoft Corporation develops, licenses, and supports a range of software products, services, and devices. The company's segments include Productivity and Business Processes, Intelligent Cloud, and More Personal Computing. Its products include operating systems, cross-device productivity applications, server applications, business solution applications, desktop and server management tools, software development tools, and video games."
  },
  AMZN: {
    industry: "Internet Retail",
    sector: "Consumer Cyclical",
    ceo: "Andy Jassy",
    headquarters: "Seattle, Washington, USA",
    website: "https://www.amazon.com",
    description: "Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions in North America and internationally. The company operates through three segments: North America, International, and Amazon Web Services (AWS). It sells merchandise and content purchased for resale from third-party sellers through physical and online stores. It also manufactures and sells electronic devices, including Kindle, Fire tablet, Fire TV, Echo, and Ring."
  },
  TSLA: {
    industry: "Auto Manufacturers",
    sector: "Consumer Cyclical",
    ceo: "Elon Musk",
    headquarters: "Austin, Texas, USA",
    website: "https://www.tesla.com",
    description: "Tesla, Inc. designs, develops, manufactures, sells and leases high-performance fully electric vehicles and energy generation and storage systems, and offers services related to its products. The company’s automotive segment includes the design, development, manufacture, and sale of electric vehicles. The energy generation and storage segment includes the design, manufacture, installation, sale, and lease of stationary energy storage products and solar energy systems."
  },
  NVDA: {
    industry: "Semiconductors",
    sector: "Technology",
    ceo: "Jensen Huang",
    headquarters: "Santa Clara, California, USA",
    website: "https://www.nvidia.com",
    description: "NVIDIA Corporation provides graphics, and compute and networking solutions in the United States, Taiwan, China, and internationally. The company's Graphics segment offers GPUs for gaming and PCs, the GeForce NOW game streaming service, and related infrastructure. Its Compute & Networking segment provides Data Center platforms and systems for AI, HPC, and accelerated computing; Mellanox networking and interconnect solutions; and automotive AI Cockpit, and autonomous driving development agreements."
  },
  META: {
    industry: "Internet Content & Information",
    sector: "Communication Services",
    ceo: "Mark Zuckerberg",
    headquarters: "Menlo Park, California, USA",
    website: "https://investor.fb.com",
    description: "Meta Platforms, Inc. develops products that enable people to connect and share with friends and family through mobile devices, personal computers, virtual reality headsets, and in-home devices. The company's products include Facebook, Instagram, Messenger, WhatsApp, and Oculus. The company is also heavily investing in the metaverse, a shared virtual environment that it hopes will be the successor to the mobile internet."
  },
  JPM: {
    industry: "Banks—Diversified",
    sector: "Financial Services",
    ceo: "Jamie Dimon",
    headquarters: "New York, New York, USA",
    website: "https://www.jpmorganchase.com",
    description: "JPMorgan Chase & Co. is a financial holding company, which provides financial and investment banking services. It offers a range of investment banking products and services in all major capital markets, including advising on corporate strategy and structure, capital-raising in equity and debt markets, risk management, market-making in cash securities and derivative instruments."
  },
  '600519': {
    industry: "Beverages—Wineries & Distilleries",
    sector: "Consumer Defensive",
    ceo: "Ding Xiongjun",
    headquarters: "Renhuai, Guizhou, China",
    website: "http://www.moutaichina.com",
    description: "Kweichow Moutai Co., Ltd. is a Chinese state-owned enterprise that specializes in the production and sales of Moutai liquor (baijiu). It is the world's most valuable liquor company and is known for its premium brand image and strong market demand in China."
  },
  '601318': {
    industry: "Insurance—Life",
    sector: "Financial Services",
    ceo: "Xie Yonglin & Jessica Tan",
    headquarters: "Shenzhen, Guangdong, China",
    website: "https://www.pingan.com",
    description: "Ping An Insurance (Group) Company of China, Ltd. is a Chinese holding conglomerate whose subsidiaries mainly deal with insurance, banking, asset management, financial services, and healthcare. It is one of the world's largest insurers and provides a comprehensive suite of financial products."
  },
  '300750': {
    industry: "Auto Parts",
    sector: "Consumer Cyclical",
    ceo: "Zeng Yuqun (Robin Zeng)",
    headquarters: "Ningde, Fujian, China",
    website: "https://www.catl.com",
    description: "Contemporary Amperex Technology Co. Limited (CATL) is a Chinese battery manufacturer and technology company that is the world's largest producer of electric vehicle (EV) batteries. It supplies major global automakers and is a key player in the transition to electric mobility."
  },
  '002594': {
    industry: "Auto Manufacturers",
    sector: "Consumer Cyclical",
    ceo: "Wang Chuanfu",
    headquarters: "Shenzhen, Guangdong, China",
    website: "https://www.byd.com",
    description: "BYD Company Ltd. is a Chinese multinational manufacturing company. It has two major subsidiaries, BYD Automobile and BYD Electronic. It is a major manufacturer of automobiles, battery-powered bicycles, buses, forklifts, solar panels, rechargeable batteries, and most notably, electric vehicles."
  }
};

const defaultProfile = {
    industry: "N/A",
    sector: "N/A",
    ceo: "N/A",
    headquarters: "N/A",
    website: "#",
    description: "No company profile information is available for this ticker."
};

export const fetchCompanyProfile = async (ticker: string, name: string): Promise<CompanyProfile> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const profileData = companyProfiles[ticker] || defaultProfile;
      resolve({
        ticker,
        name,
        ...profileData,
      });
    }, 600); // Simulate network delay
  });
};