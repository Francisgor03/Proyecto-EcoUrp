export default function ThemeScript() {
  // Runs before hydration to avoid a flash of wrong theme.
  const code = `
(function () {
  try {
    var setting = localStorage.getItem('ecourp-theme') || 'system';
    var theme = setting;
    if (setting === 'system') {
      theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();`.trim();

  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

