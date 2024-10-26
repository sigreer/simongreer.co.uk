import { createHighlighter, makeSingletonHighlighter } from 'shiki';
import { bundledLanguages } from 'shiki/bundle/web';

const getHighlighter = makeSingletonHighlighter(createHighlighter);

export const codeToHtml = async ({ code, lang }: { code: string, lang: string }) => {

  const highlighter = await getHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: [
      ...Object.keys(bundledLanguages),
      {
        id: 'antlers',
        scopeName: 'text.html.statamic',
        embeddedLangs: ['html'],
        ...antlers,
      },
    ],
  });

  return highlighter.codeToHtml(code, {
    lang: lang,
    themes: {
      dark: 'github-dark',
      light: 'github-light',
    },
  });
};