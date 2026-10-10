const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'chunks');
const files = fs.readdirSync(dir);

const results = {};
files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const usesTV = content.includes('TradingViewWidget') || content.includes('tradingview');
  const usesSvg = content.includes('<svg') || content.includes('.jsx)("svg"') || content.includes('.jsx)(`svg`');
  const usesTable = content.includes('columns:') || content.includes('<table');
  const badgeMatch = content.match(/badge:`([^`]+)`/);
  const titleMatch = content.match(/title:`([^`]+)`/);
  const subtitleMatch = content.match(/subtitle:`([^`]+)`/);

  results[f] = {
    badge: badgeMatch ? badgeMatch[1] : null,
    title: titleMatch ? titleMatch[1] : null,
    subtitle: subtitleMatch ? subtitleMatch[1] : null,
    usesTV,
    usesSvg,
    usesTable,
    size: content.length
  };
});

fs.writeFileSync('chunk_analysis.json', JSON.stringify(results, null, 2));
console.log('Analysis written to chunk_analysis.json. Total analyzed:', Object.keys(results).length);
