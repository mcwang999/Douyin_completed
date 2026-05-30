export function getChapterMenuItems(width, height, chapters, unlockedChapterIds) {
  const gap = 12;
  const itemHeight = 86;
  const startY = 156;

  return chapters.map((chapter, index) => ({
    x: 30,
    y: startY + index * (itemHeight + gap),
    width: width - 60,
    height: itemHeight,
    chapterId: chapter.id,
    title: chapter.title,
    subtitle: chapter.subtitle,
    comingSoon: !!chapter.comingSoon,
    locked: !chapter.comingSoon && !unlockedChapterIds.includes(chapter.id)
  }));
}

export function hitChapterMenuItem(point, items) {
  return items.find((item) => {
    return point.x >= item.x
      && point.x <= item.x + item.width
      && point.y >= item.y
      && point.y <= item.y + item.height;
  }) || null;
}
