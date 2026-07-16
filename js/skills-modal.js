// חלון "כלים וטכנולוגיות": נפתח כמו תפריט "צור קשר" אבל כדיאלוג אמיתי (dialog),
// כדי לא להעמיס את עמוד ה"אודות" עם כל רשימת הכישורים בבת אחת.
(function () {
  const dialog = document.querySelector('[data-skills-modal]');
  if (!dialog) return;

  document.querySelectorAll('[data-open-skills]').forEach((btn) => {
    btn.addEventListener('click', () => dialog.showModal());
  });
  document.querySelectorAll('[data-close-skills]').forEach((btn) => {
    btn.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
})();
