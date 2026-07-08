export type Lang = 'nl' | 'en'

export const nav = {
  nl: { work: 'Werk', services: 'Diensten', about: 'Over mij', contact: 'Contact' },
  en: { work: 'Work', services: 'Services', about: 'About', contact: 'Contact' },
}

export const hero = {
  nl: {
    eyebrow: 'Beschikbaar voor nieuwe projecten',
    title: 'Egbert Ludema',
    subtitle: 'Full-stack developer & designer',
    lead: 'Ik bouw websites die niet alleen goed ogen, maar ook logisch werken, snel aanvoelen en bijdragen aan het doel van je bedrijf.',
    ctaPrimary: 'Bekijk mijn werk',
    ctaSecondary: 'Stuur een bericht',
    stats: [
      { value: '5+', label: 'jaar ervaring' },
      { value: '15+', label: 'projecten opgeleverd' },
      { value: '100%', label: 'maatwerk' },
    ],
  },
  en: {
    eyebrow: 'Available for new projects',
    title: 'Egbert Ludema',
    subtitle: 'Full-stack developer & designer',
    lead: "I build websites that don't just look good — they work logically, feel fast, and contribute to your business's goals.",
    ctaPrimary: 'See my work',
    ctaSecondary: 'Send a message',
    stats: [
      { value: '5+', label: 'years experience' },
      { value: '15+', label: 'projects shipped' },
      { value: '100%', label: 'custom-built' },
    ],
  },
}

export const about = {
  nl: {
    heading: 'Over mij',
    tabs: [
      {
        id: 'about',
        label: 'Over mij',
        paragraphs: [
          'Ik ben een full-stack developer met een sterke voorkeur voor front-end, design en gebruikservaring. Ik bouw websites die er niet alleen goed uitzien, maar ook logisch werken, snel aanvoelen en prettig zijn om te gebruiken.',
          'Mijn kracht ligt in de combinatie van techniek, design en strategie. Ik denk niet alleen na over hoe een website gebouwd moet worden, maar vooral over hoe bezoekers de website ervaren en hoe de website kan bijdragen aan de doelen van een bedrijf.',
          'Mijn expertise ligt onder andere in Next.js, PayloadCMS, GSAP, Shopify, WordPress, Figma, UX/UI design en SEO optimalisatie. Daarnaast verdiep ik mij steeds verder in Google Ads, Google Analytics en Google Tag Manager.',
          'Op dit moment werk ik veel met WordPress-websites vanuit agencies en bouw ik op maat gemaakte websites met Next.js en PayloadCMS voor klanten. Daarnaast ontwikkel ik maatwerk WordPress-websites met Oxygen wanneer de voorkeur bij WordPress ligt.',
        ],
        skillsLabel: 'Focus',
        skills: ['Next.js', 'PayloadCMS', 'GSAP', 'Shopify', 'WordPress', 'Figma', 'UX/UI Design', 'SEO'],
      },
      {
        id: 'story',
        label: 'Mijn verhaal',
        heading: 'Hoe het begon',
        paragraphs: [
          'Vanaf jonge leeftijd was ik al geïnteresseerd in computers, technologie en het internet. Daarom koos ik voor de opleiding Applicatie- en Mediaontwikkeling op MBO 4.',
          'Tijdens deze opleiding leerde ik de technische basis van webdevelopment. Toch merkte ik dat mijn interesse verder ging: ik wilde ook begrijpen waarom een website prettig werkt en hoe je een digitale ervaring maakt die logisch voelt.',
          'Die interesse bracht mij naar Communicatie en Multimedia Design aan NHL Stenden Hogeschool, waar ik inmiddels ben afgestudeerd. Ik leerde over designprincipes, gebruikersonderzoek en interactieontwerp.',
          'Sindsdien combineer ik techniek, design en strategie in mijn werk, met moderne tools zoals Next.js, PayloadCMS, GSAP, Shopify, WordPress en Figma.',
        ],
        timeline: [
          { year: 'MBO 4', label: 'Applicatie- en Mediaontwikkeling' },
          { year: 'HBO', label: 'Communicatie en Multimedia Design — NHL Stenden' },
          { year: 'Nu', label: 'Freelance developer & designer' },
        ],
      },
      {
        id: 'vision',
        label: 'Mijn visie',
        quote:
          'Een goede website moet meer doen dan er mooi uitzien. Hij moet duidelijk zijn, vertrouwen uitstralen en bezoekers helpen snel te vinden wat ze zoeken.',
        paragraphs: [
          'Daarom kijk ik verder dan alleen design of techniek. Een website moet passen bij het merk, logisch zijn voor de doelgroep en bijdragen aan concrete doelen: meer aanvragen, betere vindbaarheid of een sterkere online uitstraling.',
          'Soms betekent dat dat ik een wens van de klant vertaal naar een oplossing die beter werkt voor de gebruiker. Mijn doel is om websites te bouwen die mooi ogen, goed werken, goed gevonden worden en klaar zijn om verder te groeien.',
        ],
      },
      {
        id: 'values',
        label: 'Mijn waarden',
        values: [
          {
            title: 'Kwaliteit eerst',
            text: 'Ik focus niet alleen op het uiterlijk, maar ook op functionaliteit, snelheid, beheerbaarheid, vindbaarheid en gebruiksvriendelijkheid.',
          },
          {
            title: 'Meedenkend',
            text: 'Niet alles wat mogelijk is, is automatisch nodig. Ik denk mee vanuit de doelen van het bedrijf, de gebruiker en de technische mogelijkheden.',
          },
          {
            title: 'Design en techniek samen',
            text: 'Een sterk ontwerp werkt pas echt wanneer het technisch goed is uitgevoerd — visueel sterk, snel en logisch beheerbaar.',
          },
          {
            title: 'Altijd blijven leren',
            text: 'Ik verdiep mij regelmatig in nieuwe tools, frameworks, SEO, tracking en analytics om betere, meetbare websites te bouwen.',
          },
        ],
      },
    ],
  },
  en: {
    heading: 'About me',
    tabs: [
      {
        id: 'about',
        label: 'About me',
        paragraphs: [
          "I'm a full-stack developer with a strong focus on front-end, design, and user experience. I build websites that don't just look good — they work logically, feel fast, and are genuinely pleasant to use.",
          "My strength lies in combining engineering, design, and strategy. I don't just think about how a website should be built, but especially about how visitors experience it and how it can help a business reach its goals.",
          "My expertise includes Next.js, PayloadCMS, GSAP, Shopify, WordPress, Figma, UX/UI design, and SEO optimization. I'm also continuously deepening my knowledge of Google Ads, Google Analytics, and Google Tag Manager.",
          "Right now I work a lot with WordPress websites for agencies, while also building custom websites with Next.js and PayloadCMS for clients. I also develop custom WordPress sites with Oxygen when that's the client's preference.",
        ],
        skillsLabel: 'Focus',
        skills: ['Next.js', 'PayloadCMS', 'GSAP', 'Shopify', 'WordPress', 'Figma', 'UX/UI Design', 'SEO'],
      },
      {
        id: 'story',
        label: 'My story',
        heading: 'How it started',
        paragraphs: [
          'From a young age I was interested in computers, technology, and the internet — so I chose the Application & Media Development program at MBO level 4.',
          'During that program I learned the technical foundations of web development. But my interest went further: I wanted to understand why a website feels good to use, and how to create a digital experience that feels logical.',
          "That interest led me to Communication & Multimedia Design at NHL Stenden University of Applied Sciences, where I've since graduated. I learned about design principles, user research, and interaction design.",
          'Since then I combine engineering, design, and strategy in my work, using modern tools like Next.js, PayloadCMS, GSAP, Shopify, WordPress, and Figma.',
        ],
        timeline: [
          { year: 'MBO 4', label: 'Application & Media Development' },
          { year: 'BA', label: 'Communication & Multimedia Design — NHL Stenden' },
          { year: 'Now', label: 'Freelance developer & designer' },
        ],
      },
      {
        id: 'vision',
        label: 'My vision',
        quote:
          "A good website has to do more than look nice. It should be clear, build trust, and help visitors quickly find what they're looking for.",
        paragraphs: [
          "That's why I look beyond just design or technology. A website has to fit the brand, make sense for the audience, and contribute to concrete goals — more inquiries, better visibility, or a stronger online presence.",
          "Sometimes that means translating a client's initial request into a solution that works better for the user. My goal is to build websites that look great, work well, get found, and are ready to grow further.",
        ],
      },
      {
        id: 'values',
        label: 'My values',
        values: [
          {
            title: 'Quality first',
            text: "I don't just focus on how a website looks, but also on functionality, speed, manageability, findability, and usability.",
          },
          {
            title: 'Collaborative thinking',
            text: "Not everything that's possible is automatically necessary. I think from the business's goals, the user's needs, and technical possibilities.",
          },
          {
            title: 'Design & engineering together',
            text: 'A strong design only really works once technically well executed — visually strong, fast, and logically maintainable.',
          },
          {
            title: 'Always learning',
            text: 'I regularly dive into new tools, frameworks, SEO, tracking, and analytics to build better, more measurable websites.',
          },
        ],
      },
    ],
  },
}

export type Project = {
  name: string
  client: string
  blurb: string
  tags: string[]
  href: string
  gradient: 'violet' | 'magenta' | 'indigo'
}

export const work = {
  nl: {
    heading: 'Geselecteerd werk',
    lead: 'Een greep uit projecten die ik recent heb gebouwd.',
    items: [
      {
        name: 'DICE Label',
        client: 'Fashion / Shopify',
        blurb:
          'Custom Shopify webshop voor modemerk DICE Label — op maat gemaakte homepage, meerdere producttemplates en een ingebouwde fit guide.',
        tags: ['Shopify', 'E-commerce', 'Fashion'],
        href: 'https://www.el-websolutions.com/projecten/dice-label',
        gradient: 'violet',
      },
      {
        name: 'Pelletboerderij',
        client: 'WooCommerce',
        blurb:
          "WooCommerce webshop die een verouderde website verving, met een zelf ontwikkelde 'Distance Based Shipping'-plugin via de Google Maps API.",
        tags: ['WordPress', 'WooCommerce', 'Custom plugin'],
        href: 'https://www.el-websolutions.com/projecten/pellet-boerderij',
        gradient: 'magenta',
      },
      {
        name: 'A7 Motoren',
        client: 'WordPress',
        blurb:
          'WordPress website voor motor- en scooterdealer A7 Motoren in Sneek, met voorraad, diensten en nieuws overzichtelijk gepresenteerd.',
        tags: ['WordPress', 'Business site'],
        href: 'https://www.el-websolutions.com/projecten/a7motoren',
        gradient: 'indigo',
      },
    ] satisfies Project[],
  },
  en: {
    heading: 'Selected work',
    lead: "A few projects I've recently built.",
    items: [
      {
        name: 'DICE Label',
        client: 'Fashion / Shopify',
        blurb:
          'Custom Shopify storefront for fashion brand DICE Label — a tailor-made homepage, multiple product templates, and a built-in fit guide.',
        tags: ['Shopify', 'E-commerce', 'Fashion'],
        href: 'https://www.el-websolutions.com/projecten/dice-label',
        gradient: 'violet',
      },
      {
        name: 'Pelletboerderij',
        client: 'WooCommerce',
        blurb:
          "WooCommerce webshop replacing an outdated website, with a custom-built 'Distance Based Shipping' plugin via the Google Maps API.",
        tags: ['WordPress', 'WooCommerce', 'Custom plugin'],
        href: 'https://www.el-websolutions.com/projecten/pellet-boerderij',
        gradient: 'magenta',
      },
      {
        name: 'A7 Motoren',
        client: 'WordPress',
        blurb:
          'WordPress website for motorcycle and scooter dealer A7 Motoren in Sneek, presenting inventory, services, and news in one clear overview.',
        tags: ['WordPress', 'Business site'],
        href: 'https://www.el-websolutions.com/projecten/a7motoren',
        gradient: 'indigo',
      },
    ] satisfies Project[],
  },
}

export const services = {
  nl: {
    heading: 'Diensten',
    title: 'Websites op maat en freelance development',
    lead: 'Ik bouw websites op maat en sluit aan als freelance developer voor agencies en bedrijven die extra technische capaciteit nodig hebben.',
    items: [
      {
        title: 'Freelance Developer voor Agencies',
        text: "Werk je als agency aan meerdere klantprojecten tegelijk en zoek je een developer die snel kan aansluiten? Ik help bureaus met het bouwen, doorontwikkelen en technisch afronden van websites, landingspagina's en Shopify-aanpassingen. White-label, aansluitend op bestaande designs en developmentflows.",
        tags: ['freelance', 'agencies', 'white-label', 'full-stack', 'Shopify'],
        price: 'Projectbasis of retainer',
      },
      {
        title: 'Freelance Developer voor Bedrijven',
        text: 'Development werk liggen, maar geen behoefte aan een fulltime hire? Ik sluit aan op project- of contractbasis: nieuwe features, verbeteringen aan bestaande websites of webshops, en het technisch uitvoeren van digitale plannen.',
        tags: ['freelance', 'bedrijven', 'full-stack', 'doorontwikkeling', 'contractbasis'],
        price: 'Contractbasis of projectbasis',
      },
      {
        title: 'Websites op maat',
        text: 'Voor ondernemers die een complete website of webshop willen laten bouwen: een oplossing op maat die goed oogt én logisch werkt. Van structuur en inhoud tot techniek en livegang — snel, gebruiksvriendelijk en schaalbaar.',
        tags: ['websites', 'maatwerk', 'Next.js', 'WordPress', 'responsive', 'conversie'],
        price: 'Vanaf €1399,-',
      },
      {
        title: 'Shopify Development',
        text: 'Een standaard Shopify thema is een goed begin, maar niet altijd genoeg. Custom secties, extra blokken, aangepaste templates en onderdelen gericht op branding, conversie en gebruiksgemak.',
        tags: ['Shopify', 'maatwerk', 'themes', 'custom sections', 'e-commerce'],
        price: 'Prijs op aanvraag',
      },
      {
        title: 'Onderhoud en Doorontwikkeling',
        text: 'Een website is zelden echt af. Updates, bugfixes, technische verbeteringen, performance-optimalisaties en nieuwe functionaliteiten voor bestaande projecten.',
        tags: ['onderhoud', 'doorontwikkeling', 'support', 'performance', 'bugfixes'],
        price: 'Vanaf €95,- per maand',
      },
    ],
    cta: 'Bekijk dienst',
  },
  en: {
    heading: 'Services',
    title: 'Custom websites & freelance development',
    lead: 'I build custom websites and plug in as a freelance developer for agencies and businesses that need extra technical capacity.',
    items: [
      {
        title: 'Freelance Developer for Agencies',
        text: 'Working on multiple client projects at once and need a developer who can jump in quickly? I help agencies build, extend, and technically finish websites, landing pages, and Shopify customizations — white-label, plugging into existing designs and workflows.',
        tags: ['freelance', 'agencies', 'white-label', 'full-stack', 'Shopify'],
        price: 'Project basis or retainer',
      },
      {
        title: 'Freelance Developer for Businesses',
        text: "Development work lined up but no need for a full-time hire? I join on a project or contract basis: new features, improvements to existing websites or webshops, and technical execution of digital plans.",
        tags: ['freelance', 'businesses', 'full-stack', 'ongoing dev', 'contract basis'],
        price: 'Contract basis or project basis',
      },
      {
        title: 'Custom Websites',
        text: "For entrepreneurs who want a complete website or webshop built from scratch: a custom solution that looks great and works logically. From structure and content to engineering and launch — fast, user-friendly, and scalable.",
        tags: ['websites', 'custom', 'Next.js', 'WordPress', 'responsive', 'conversion'],
        price: 'From €1,399',
      },
      {
        title: 'Shopify Development',
        text: "A standard Shopify theme is a good start, but not always enough. Custom sections, extra blocks, tailored templates, and components focused on branding, conversion, and usability.",
        tags: ['Shopify', 'custom', 'themes', 'custom sections', 'e-commerce'],
        price: 'Price on request',
      },
      {
        title: 'Maintenance & Ongoing Development',
        text: "A website is rarely truly finished. Updates, bug fixes, technical improvements, performance optimizations, and new features for existing projects.",
        tags: ['maintenance', 'ongoing dev', 'support', 'performance', 'bug fixes'],
        price: 'From €95 / month',
      },
    ],
    cta: 'View service',
  },
}

export const contact = {
  nl: {
    eyebrow: 'Contact',
    heading: 'Laten we samenwerken',
    lead: 'Heb je een project, vraag of gewoon zin om te sparren? Stuur een bericht, ik reageer altijd persoonlijk.',
    email: 'info@el-websolutions.com',
    cta: 'Stuur een e-mail',
  },
  en: {
    eyebrow: 'Contact',
    heading: "Let's work together",
    lead: 'Have a project, a question, or just want to brainstorm? Send a message — I always reply personally.',
    email: 'info@el-websolutions.com',
    cta: 'Send an email',
  },
}

export const footer = {
  nl: {
    tagline: 'Full-stack developer & designer, gebouwd rond één punt: aandacht voor detail.',
    rights: 'Alle rechten voorbehouden.',
  },
  en: {
    tagline: 'Full-stack developer & designer, built around one point: attention to detail.',
    rights: 'All rights reserved.',
  },
}
