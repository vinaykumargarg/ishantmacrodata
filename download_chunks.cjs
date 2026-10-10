const fs = require('fs');
const https = require('https');
const path = require('path');

const chunks = [
  'TradingViewWidget-D4_mPerT.js',
  'ConfluencePanel-B8TD7ZQi.js',
  'global-intel-CBLibw9I.js',
  'crypto-brain-CtJr_29E.js',
  'macro-engine-BBcVKbdJ.js',
  'economic-events-Bjt6XZQ4.js',
  'btc-engine-saaAmoHc.js',
  'onchain-engine-CMMPtwOJ.js',
  'whales-608MIYdX.js',
  'derivatives-engine-LSClorOi.js',
  'liquidation-map-DYF_2Z95.js',
  'options-fKMw8Bez.js',
  'etf-Ce1rjCWK.js',
  'stablecoin-engine-Dypggqla.js',
  'eth-engine-B9Ozi6vz.js',
  'altcoins-C1GhJe6z.js',
  'defi-Bbie2zbE.js',
  'narratives-ClQyKSJO.js',
  'smart-money-VebbJ3q2.js',
  'crypto-calendar-tcIoxlaf.js',
  'overview-Bh1NOsGz.js',
  'daily-report-3CvJr8oD.js',
  'crowd-B91qmnm_.js',
  'confluence-DtfuyNbH.js',
  'scanner-D7cJZm7p.js',
  'regime-DtoTdShN.js',
  'us-economy-hEkw8Ccb.js',
  'gdp-W6t-d2yh.js',
  'inflation-D7bcu0RX.js',
  'labour-CQ810NhY.js',
  'calendar-DHcsYeUw.js',
  'fed-9ZLnMnA_.js',
  'liquidity-Bi-u00bS.js',
  'yields-DAYmmsZO.js',
  'central-banks-CyNZcbjE.js',
  'macro-By3RpBDt.js',
  'crypto-ooSCcTIk.js',
  'onchain-CQ6wOCVv.js',
  'derivatives-9MLuafom.js',
  'gold-D0qD6Kyd.js',
  'stocks-BF_0jWiT.js',
  'forex-CvAkHmwV.js',
  'geopolitics-Cb6Hqahi.js',
  'socioeconomic-D4o3NAaO.js',
  'news-PSoo3Fsa.js',
  'sentiment---8U4SQs.js',
  'put-call-pWSXCZtB.js',
  'correlations-Cf_0ID2z.js',
  'assistant-C0lto2qF.js',
  'risk-B98e1KFW.js',
  'journal-DBc0EvmH.js',
  'reports-CK95JlRG.js',
  'alerts-xnqeu9Mu.js',
  'account-qYStzJY4.js'
];

const destDir = path.join(__dirname, 'chunks');
if (!fs.existsSync(destDir)) fs.mkdirSync(destDir);

let completed = 0;
chunks.forEach(c => {
  const file = fs.createWriteStream(path.join(destDir, c));
  https.get(`https://ishantmircodata.lovable.app/assets/${c}`, res => {
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      completed++;
      if (completed === chunks.length) {
        console.log(`Downloaded all ${chunks.length} chunks successfully!`);
      }
    });
  }).on('error', err => {
    console.error(`Failed ${c}:`, err.message);
  });
});
