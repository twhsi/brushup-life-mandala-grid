async function loadTalks() {
  const res = await fetch('./data/talks.json');
  if (!res.ok) throw new Error('Cannot load data/talks.json');
  return await res.json();
}

function firstNonBlankCard(section) {
  return section.cards.find(card => !card.isBlank) || section.cards[0] || null;
}

function flattenCards(talks) {
  return talks.flatMap(talk =>
    talk.sections.flatMap(section =>
      section.cards.map(card => ({
        ...card,
        talkTitle: talk.title,
        sectionTitle: section.title
      }))
    )
  );
}

export { loadTalks, firstNonBlankCard, flattenCards };
