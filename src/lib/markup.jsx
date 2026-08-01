import { Fragment } from 'react';

// The data files mark up manip text with a light markdown dialect:
//   **like this**  a Squall ATB note
//   *like this*    something to pay attention to
// Rendered as React nodes rather than injected HTML.
const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;

export function renderManip(text, italicClass = 'kai-important') {
  if (text === null || text === undefined) return null;

  return String(text)
    .split(TOKEN)
    .filter((part) => part !== '')
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <b key={i} className="kai-satb">
            {part.slice(2, -2)}
          </b>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <b key={i} className={italicClass}>
            {part.slice(1, -1)}
          </b>
        );
      }
      return <Fragment key={i}>{part}</Fragment>;
    });
}

export const renderPattern = (text) => renderManip(text, 'kai-atb');
