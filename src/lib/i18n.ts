import type { Locale } from './locale'

/** Every hardcoded (non-CMS) user-facing string in the UI, in both
 * languages. CMS content (project copy, page globals) is translated
 * separately via Payload's own localization. */
export const dictionaries = {
  en: {
    meta: {
      title: 'Egbert Ludema · Portfolio',
      description: 'Selected work, viewed in three dimensions.',
    },
    nav: {
      mark: 'Egbert Ludema',
      home: 'Home',
      about: 'About me',
      projects: 'Projects',
      contact: 'Contact',
      siteNavigation: 'Site navigation',
      projectList: 'Project list',
    },
    home: {
      scrollHint: 'scroll',
      viewProject: 'View project',
      noProjects: 'No projects yet. Add some in the Payload admin.',
      webglError: 'The 3D view keeps crashing on this device. Refresh to try again.',
    },
    about: {
      education: 'Education',
      experience: 'Experience',
    },
    common: {
      gallery: 'Gallery',
      skills: 'Skills',
      related: 'Related',
      projects: 'Projects',
      noSkillsLinked: 'No skills linked yet.',
      noSkillsAdded: 'No skills added yet.',
      noProjectsForSkill: 'No projects linked to this skill yet.',
    },
    gallery: {
      openImage: (index: number, total: number) => `Open image ${index} of ${total}`,
      close: 'Close',
      previousImage: 'Previous image',
      nextImage: 'Next image',
    },
    notFound: {
      heading: 'Not found',
      body: "There's nothing here. The page or project you're looking for doesn't exist.",
    },
  },
  nl: {
    meta: {
      title: 'Egbert Ludema · Portfolio',
      description: 'Uitgelicht werk, bekeken in drie dimensies.',
    },
    nav: {
      mark: 'Egbert Ludema',
      home: 'Home',
      about: 'Over mij',
      projects: 'Projecten',
      contact: 'Contact',
      siteNavigation: 'Sitenavigatie',
      projectList: 'Projectenlijst',
    },
    home: {
      scrollHint: 'scroll',
      viewProject: 'Bekijk project',
      noProjects: 'Nog geen projecten. Voeg ze toe in het Payload admin.',
      webglError: 'De 3D-weergave blijft crashen op dit apparaat. Ververs de pagina om het opnieuw te proberen.',
    },
    about: {
      education: 'Opleiding',
      experience: 'Werkervaring',
    },
    common: {
      gallery: 'Galerij',
      skills: 'Vaardigheden',
      related: 'Gerelateerd',
      projects: 'Projecten',
      noSkillsLinked: 'Nog geen vaardigheden gekoppeld.',
      noSkillsAdded: 'Nog geen vaardigheden toegevoegd.',
      noProjectsForSkill: 'Nog geen projecten gekoppeld aan deze vaardigheid.',
    },
    gallery: {
      openImage: (index: number, total: number) => `Open afbeelding ${index} van ${total}`,
      close: 'Sluiten',
      previousImage: 'Vorige afbeelding',
      nextImage: 'Volgende afbeelding',
    },
    notFound: {
      heading: 'Niet gevonden',
      body: 'Hier is niets te vinden. De pagina of het project dat je zoekt bestaat niet.',
    },
  },
} as const satisfies Record<Locale, unknown>

export function getDictionary(locale: Locale) {
  return dictionaries[locale]
}

export type Dictionary = ReturnType<typeof getDictionary>
