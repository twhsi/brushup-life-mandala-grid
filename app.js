const state = {
  talks: [],
  talkIndex: 0,
  sectionIndex: 0,
  cardIndex: 0,
  imageIndex: 0,
  showBlank: true,
};

const el = {};

document.addEventListener("DOMContentLoaded", async () => {
  cacheElements();
  bindEvents();

  try {
    const [talksResponse, ...imageResponses] = await Promise.all([
      fetch("data/talks.json"),
      fetch("data/slide-images-brushup-life-1.json"),
      fetch("data/slide-images-happiness-spectrum.json"),
      fetch("data/slide-images-chiu-20260529.json"),
    ]);
    if (!talksResponse.ok) throw new Error(`talks.json HTTP ${talksResponse.status}`);
    const failedImages = imageResponses.find((response) => !response.ok);
    if (failedImages) throw new Error(`slide images HTTP ${failedImages.status}`);
    const [data, ...imageDataList] = await Promise.all([
      talksResponse.json(),
      ...imageResponses.map((response) => response.json()),
    ]);
    state.talks = data.talks || [];
    if (!state.talks.length) throw new Error("找不到 talks 資料");
    imageDataList.forEach((imageData) => mergeSlideImages(imageData.mapping || []));
    selectFirstReadableCard();
    render();
  } catch (error) {
    el.cardTitle.textContent = "無法讀取資料";
    el.cardContent.textContent = "請透過本機伺服器開啟網站，例如：python3 -m http.server 4176";
    console.error(error);
  }
});

function cacheElements() {
  [
    "archiveCount", "talkList", "sectionCount", "sectionList", "centerTitle", "centerContent",
    "cardGridId", "cardSectionLabel", "cardTitle", "cardContent", "cardStatus", "cardSource",
    "cardImageWrap", "cardImageControls", "cardImage", "cardImageCaption", "cardImageCounter",
    "imagePrevButton", "imageNextButton",
    "positiveKeywords", "cardLocation", "sourceShort", "quickTalk", "quickSection", "quickCard",
    "sectionSelect", "trailHeading", "trailList", "blankToggle", "previousButton", "nextButton",
    "copyButton", "draftButton", "searchCell", "searchDialog", "searchInput", "searchResults",
    "navToggle", "compassToggle", "sidebar", "compassPanel", "toast",
  ].forEach((id) => { el[id] = document.getElementById(id); });
}

function bindEvents() {
  el.previousButton.addEventListener("click", () => moveCard(-1));
  el.nextButton.addEventListener("click", () => moveCard(1));
  el.imagePrevButton.addEventListener("click", () => moveImage(-1));
  el.imageNextButton.addEventListener("click", () => moveImage(1));
  el.copyButton.addEventListener("click", copyCurrentCard);
  el.draftButton.addEventListener("click", () => showToast("AI 草稿功能將在下一階段接上；MVP 先保留入口。"));
  el.searchCell.addEventListener("click", openSearch);
  el.searchInput.addEventListener("input", renderSearchResults);
  el.blankToggle.addEventListener("change", () => {
    state.showBlank = el.blankToggle.checked;
    renderTrail();
  });
  el.sectionSelect.addEventListener("change", () => {
    const [talkIndex, sectionIndex] = el.sectionSelect.value.split(":").map(Number);
    state.talkIndex = talkIndex;
    state.sectionIndex = sectionIndex;
    state.imageIndex = 0;
    selectFirstReadableCard();
    render();
    closeMobilePanels();
  });
  el.navToggle.addEventListener("click", () => {
    el.sidebar.classList.toggle("open");
    el.compassPanel.classList.remove("open");
  });
  el.compassToggle.addEventListener("click", () => {
    el.compassPanel.classList.toggle("open");
    el.sidebar.classList.remove("open");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" && !el.searchDialog.open) moveCard(-1);
    if (event.key === "ArrowRight" && !el.searchDialog.open) moveCard(1);
    if (event.key === "/" && !el.searchDialog.open) {
      event.preventDefault();
      openSearch();
    }
  });
}

function currentTalk() {
  return state.talks[state.talkIndex];
}

function currentSection() {
  return currentTalk().sections[state.sectionIndex];
}

function currentCard() {
  return currentSection().cards[state.cardIndex];
}

function mergeSlideImages(mapping) {
  mapping.forEach((item) => {
    const talk = state.talks.find((candidate) => candidate.id === item.talkId);
    if (!talk) return;

    let node;
    if (item.kind === "center") {
      node = talk.center;
    } else if (item.kind === "section") {
      node = talk.sections.find((section) => section.id === item.gridId);
    } else {
      node = talk.sections
        .flatMap((section) => section.cards)
        .find((card) => card.gridId === item.gridId);
    }

    if (!node) return;
    const images = (item.images || (item.image ? [item] : []))
      .filter((image) => image.image)
      .map((image) => ({
        pdfPage: image.pdfPage,
        image: image.image.replace(/^\/assets\//, "public/assets/"),
        alt: image.alt,
        fit: image.fit || item.fit || "contain",
      }));
    node.images = images;
    node.image = images[0]?.image || "";
    node.pdfPage = images[0]?.pdfPage ?? item.pdfPage;
    node.imageAlt = images[0]?.alt || item.alt;
    node.imageFit = images[0]?.fit || item.fit;
    node.pageRange = item.pageRange;
    node.slideCount = item.slideCount || images.length;
  });
}

function selectFirstReadableCard() {
  const cards = currentSection().cards;
  const readableIndex = cards.findIndex((card) => !card.isBlank);
  state.cardIndex = readableIndex >= 0 ? readableIndex : 0;
}

function render() {
  renderTalks();
  renderSections();
  renderSectionSelect();
  renderCard();
  renderTrail();
  renderArchiveCount();
}

function renderTalks() {
  el.talkList.replaceChildren(...state.talks.map((talk, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `talk-button${index === state.talkIndex ? " active" : ""}`;
    button.innerHTML = `
      <span class="talk-number">${index + 1}</span>
      <span><strong>${escapeHtml(talk.title)}</strong><small>${talk.sections.length} Sections · 64 Trail cards</small></span>
    `;
    button.addEventListener("click", () => {
      state.talkIndex = index;
      state.sectionIndex = 0;
      state.imageIndex = 0;
      selectFirstReadableCard();
      render();
    });
    return button;
  }));

  el.centerTitle.textContent = currentTalk().center.title;
  el.centerContent.textContent = currentTalk().center.content;
}

function renderSections() {
  const sections = currentTalk().sections;
  el.sectionCount.textContent = `${sections.length} sections`;
  el.sectionList.replaceChildren(...sections.map((section, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `section-button${index === state.sectionIndex ? " active" : ""}`;
    button.innerHTML = `<b>${escapeHtml(section.id)}</b><span>${escapeHtml(section.title)}</span><i>›</i>`;
    button.addEventListener("click", () => {
      state.sectionIndex = index;
      state.imageIndex = 0;
      selectFirstReadableCard();
      render();
      closeMobilePanels();
    });
    return button;
  }));
}

function renderSectionSelect() {
  const options = [];
  state.talks.forEach((talk, talkIndex) => {
    const group = document.createElement("optgroup");
    group.label = talk.title;
    talk.sections.forEach((section, sectionIndex) => {
      const option = document.createElement("option");
      option.value = `${talkIndex}:${sectionIndex}`;
      option.textContent = `${section.id} ${section.title}`;
      option.selected = talkIndex === state.talkIndex && sectionIndex === state.sectionIndex;
      group.append(option);
    });
    options.push(group);
  });
  el.sectionSelect.replaceChildren(...options);
}

function renderCard() {
  const talk = currentTalk();
  const section = currentSection();
  const card = currentCard();
  const displayTitle = card.isBlank ? "此格空白" : card.title;
  const displayContent = card.isBlank ? "此格空白" : card.content;
  const cardImages = getCardImages(card);
  state.imageIndex = Math.min(state.imageIndex, Math.max(cardImages.length - 1, 0));
  const activeImage = cardImages[state.imageIndex];

  el.cardGridId.textContent = card.gridId;
  el.cardSectionLabel.textContent = `Section ${section.id} · ${section.title}`;
  el.cardTitle.textContent = displayTitle;
  el.cardContent.textContent = displayContent;
  el.cardContent.classList.toggle("blank", card.isBlank);
  el.cardImageWrap.hidden = !activeImage;
  if (activeImage) {
    el.cardImage.src = activeImage.image;
    el.cardImage.alt = activeImage.alt || `${talk.title} ${card.gridId}`;
    el.cardImage.style.objectFit = activeImage.fit || "contain";
    el.cardImageControls.hidden = cardImages.length <= 1;
    el.cardImageCounter.textContent = `投影片 ${state.imageIndex + 1} / ${cardImages.length}`;
    el.imagePrevButton.disabled = state.imageIndex === 0;
    el.imageNextButton.disabled = state.imageIndex === cardImages.length - 1;
    el.cardImageCaption.textContent = card.pageRange && cardImages.length > 1
      ? `PDF 第 ${activeImage.pdfPage} 頁（本格 ${card.pageRange}）`
      : `PDF 第 ${activeImage.pdfPage} 頁`;
  } else {
    el.cardImage.removeAttribute("src");
    el.cardImage.alt = "";
    el.cardImageControls.hidden = true;
    el.cardImageCounter.textContent = "";
    el.cardImageCaption.textContent = "";
  }
  el.cardStatus.textContent = card.isBlank ? "空白卡" : "非空白卡";
  el.cardStatus.dataset.blank = String(card.isBlank);
  el.cardSource.textContent = card.sourceFile;
  el.positiveKeywords.textContent = card.keywords.length ? card.keywords.join("、") : "尚無關鍵字";
  el.cardLocation.textContent = `${state.talkIndex + 1} / ${section.id} / ${card.gridId}`;
  el.sourceShort.textContent = card.sourceFile;
  el.quickTalk.textContent = talk.title;
  el.quickSection.textContent = `${section.id} ${section.title}`;
  el.quickCard.textContent = `${card.gridId}（第 ${state.cardIndex + 1} 張 / 共 ${section.cards.length} 張）`;
  el.previousButton.disabled = state.cardIndex === 0;
  el.nextButton.disabled = state.cardIndex === section.cards.length - 1;
  document.title = `${card.gridId} ${displayTitle}｜重啟人生 Mandala Grid`;
}

function renderTrail() {
  const section = currentSection();
  el.trailHeading.textContent = `本 Section 的 Trail 卡片（${section.id} ${section.title}）`;
  el.trailList.replaceChildren(...section.cards.map((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `trail-card${index === state.cardIndex ? " active" : ""}${card.isBlank ? " blank" : ""}`;
    button.hidden = card.isBlank && !card.image && !state.showBlank;
    button.innerHTML = `
      <span class="trail-id">${escapeHtml(card.gridId)}</span>
      ${card.image ? `<img class="sequence-thumb" src="${escapeHtml(card.image)}" alt="" loading="lazy" />` : ""}
      <strong>${escapeHtml(card.isBlank ? "此格空白" : card.title)}</strong>
      <p>${escapeHtml(card.isBlank ? "—" : card.content)}</p>
    `;
    button.addEventListener("click", () => {
      state.cardIndex = index;
      state.imageIndex = 0;
      renderCard();
      renderTrail();
    });
    return button;
  }));

  requestAnimationFrame(() => {
    const activeCard = el.trailList.querySelector(".trail-card.active");
    if (!activeCard) return;
    const leftEdge = activeCard.offsetLeft;
    const rightEdge = leftEdge + activeCard.offsetWidth;
    if (leftEdge < el.trailList.scrollLeft) {
      el.trailList.scrollTo({ left: leftEdge, behavior: "smooth" });
    } else if (rightEdge > el.trailList.scrollLeft + el.trailList.clientWidth) {
      el.trailList.scrollTo({ left: rightEdge - el.trailList.clientWidth, behavior: "smooth" });
    }
  });
}

function renderArchiveCount() {
  const cardCount = state.talks.reduce(
    (total, talk) => total + talk.sections.reduce((sum, section) => sum + section.cards.length, 0),
    0,
  );
  el.archiveCount.textContent = `${state.talks.length} 場演講 · ${cardCount} 張 Trail 卡片`;
}

function moveCard(direction) {
  if (!state.talks.length) return;
  const nextIndex = state.cardIndex + direction;
  if (nextIndex < 0 || nextIndex >= currentSection().cards.length) return;
  state.cardIndex = nextIndex;
  state.imageIndex = 0;
  renderCard();
  renderTrail();
}

function moveImage(direction) {
  const images = getCardImages(currentCard());
  const nextIndex = state.imageIndex + direction;
  if (nextIndex < 0 || nextIndex >= images.length) return;
  state.imageIndex = nextIndex;
  renderCard();
}

function getCardImages(card) {
  return card.images?.length
    ? card.images
    : (card.image ? [{ image: card.image, pdfPage: card.pdfPage, alt: card.imageAlt, fit: card.imageFit }] : []);
}

async function copyCurrentCard() {
  const card = currentCard();
  const text = `${card.gridId}\n${card.title}\n\n${card.content || "此格空白"}`;
  try {
    await navigator.clipboard.writeText(text);
    showToast("卡片內容已複製");
  } catch {
    showToast("瀏覽器未允許複製");
  }
}

function openSearch() {
  el.searchInput.value = "";
  el.searchResults.innerHTML = '<p class="empty-results">輸入關鍵字開始搜尋</p>';
  el.searchDialog.showModal();
  requestAnimationFrame(() => el.searchInput.focus());
}

function renderSearchResults() {
  const query = el.searchInput.value.trim().toLocaleLowerCase();
  if (!query) {
    el.searchResults.innerHTML = '<p class="empty-results">輸入關鍵字開始搜尋</p>';
    return;
  }

  const results = [];
  state.talks.forEach((talk, talkIndex) => {
    talk.sections.forEach((section, sectionIndex) => {
      section.cards.forEach((card, cardIndex) => {
        const haystack = `${card.gridId} ${card.title} ${card.content}`.toLocaleLowerCase();
        if (haystack.includes(query)) results.push({ talk, section, card, talkIndex, sectionIndex, cardIndex });
      });
    });
  });

  if (!results.length) {
    el.searchResults.innerHTML = '<p class="empty-results">找不到符合的卡片</p>';
    return;
  }

  el.searchResults.replaceChildren(...results.slice(0, 40).map((result) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.innerHTML = `<b>${escapeHtml(result.card.gridId)}</b><span>${escapeHtml(result.card.title || "此格空白")} · ${escapeHtml(result.talk.title)}</span>`;
    button.addEventListener("click", () => {
      state.talkIndex = result.talkIndex;
      state.sectionIndex = result.sectionIndex;
      state.cardIndex = result.cardIndex;
      state.imageIndex = 0;
      el.searchDialog.close();
      render();
    });
    return button;
  }));
}

function closeMobilePanels() {
  el.sidebar.classList.remove("open");
  el.compassPanel.classList.remove("open");
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => el.toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[character]);
}
