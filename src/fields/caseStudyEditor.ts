import { lexicalEditor, TextStateFeature } from '@payloadcms/richtext-lexical'

/** Selecting heading text and applying one of these ("Text Color" in the
 * toolbar) marks which section of a model/framework it belongs to, e.g. the
 * four categories of the Financieel gedrag model diagram, mirroring the
 * dot colors in PageShell.module.css's .headingPurple/.headingOrange/etc. */
const HEADING_COLOR_STATE = {
  purple: { label: 'Purple', css: { color: '#8f7cc7' } },
  orange: { label: 'Orange', css: { color: '#c07a3e' } },
  yellow: { label: 'Yellow', css: { color: '#b3902a' } },
  green: { label: 'Green', css: { color: '#4c9a67' } },
}

/** Rich text editor shared by project write-ups and the page Content block,
 * both rendered through projectContentConverters. */
export const caseStudyEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures,
    TextStateFeature({ state: { headingColor: HEADING_COLOR_STATE } }),
  ],
})
